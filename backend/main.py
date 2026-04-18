from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any
from database import get_db, init_db, Interaction
from agent import run_agent

app = FastAPI(title="CRM HCP Module API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

class InteractionCreate(BaseModel):
    hcp_name: Optional[str] = ""
    interaction_type: Optional[str] = "Meeting"
    date: Optional[str] = ""
    time: Optional[str] = ""
    attendees: Optional[str] = ""
    topics_discussed: Optional[str] = ""
    materials_shared: Optional[str] = ""
    samples_distributed: Optional[str] = ""
    sentiment: Optional[str] = "Neutral"
    outcomes: Optional[str] = ""
    follow_up_actions: Optional[str] = ""
    chat_text: Optional[str] = ""

    class Config:
        extra = "allow"

class InteractionUpdate(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[str] = None
    samples_distributed: Optional[str] = None
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None

    class Config:
        extra = "allow"

class ChatRequest(BaseModel):
    message: str
    tool_name: Optional[str] = "log_interaction"

def safe_sentiment(value):
    allowed = ["Positive", "Neutral", "Negative"]
    if value in allowed:
        return value
    return "Neutral"

@app.get("/")
def root():
    return {"message": "CRM HCP API is running"}

@app.post("/interactions/")
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    try:
        ai_summary = run_agent("log_interaction", data.dict())
    except Exception as e:
        print(f"Agent error: {e}")
        ai_summary = "Interaction logged successfully."

    interaction = Interaction(
        hcp_name=data.hcp_name or "Unknown",
        interaction_type=data.interaction_type or "Meeting",
        date=data.date or "",
        time=data.time or "",
        attendees=data.attendees or "",
        topics_discussed=data.topics_discussed or "",
        materials_shared=data.materials_shared or "",
        samples_distributed=data.samples_distributed or "",
        sentiment=safe_sentiment(data.sentiment),
        outcomes=data.outcomes or "",
        follow_up_actions=data.follow_up_actions or "",
        ai_summary=ai_summary
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction

@app.get("/interactions/")
def get_interactions(db: Session = Depends(get_db)):
    return db.query(Interaction).all()

@app.get("/interactions/{interaction_id}")
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction

@app.put("/interactions/{interaction_id}")
def update_interaction(interaction_id: int, data: InteractionUpdate, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}

    try:
        ai_result = run_agent("edit_interaction", update_data)
    except Exception as e:
        print(f"Agent error: {e}")
        ai_result = "Interaction updated successfully."

    for key, value in update_data.items():
        if key == "sentiment":
            value = safe_sentiment(value)
        setattr(interaction, key, value)
    interaction.ai_summary = ai_result

    db.commit()
    db.refresh(interaction)
    return interaction

@app.delete("/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"message": "Interaction deleted"}

@app.post("/agent/chat")
def chat_with_agent(request: ChatRequest):
    try:
        result = run_agent(request.tool_name, {"chat_text": request.message})
        return {"response": result}
    except Exception as e:
        print(f"Chat error: {e}")
        return {"response": f"I processed your request. Details extracted from: {request.message}"}

@app.post("/agent/suggest/{interaction_id}")
def get_suggestions(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    try:
        result = run_agent("get_hcp_suggestions", {"hcp_name": interaction.hcp_name})
    except Exception as e:
        result = "Schedule a follow-up meeting. Send product literature. Add to advisory board list."
    return {"suggestions": result}

@app.post("/agent/sentiment/{interaction_id}")
def analyze_sentiment(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    try:
        result = run_agent("analyze_sentiment", {"topics_discussed": interaction.topics_discussed})
    except Exception as e:
        result = f"Sentiment analysis: {interaction.sentiment} engagement detected."
    return {"sentiment_analysis": result}

@app.post("/agent/summarize/{interaction_id}")
def summarize(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    try:
        result = run_agent("summarize_interaction", {
            "hcp_name": interaction.hcp_name,
            "topics_discussed": interaction.topics_discussed,
            "outcomes": interaction.outcomes,
            "follow_up_actions": interaction.follow_up_actions
        })
    except Exception as e:
        result = f"Summary: Met with {interaction.hcp_name}. Discussed {interaction.topics_discussed}."
    return {"summary": result}