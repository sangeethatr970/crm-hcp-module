from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from typing import TypedDict, Optional
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.3-70b-versatile"
)

class AgentState(TypedDict):
    messages: list
    interaction_data: dict
    tool_result: str
    tool_name: str

def log_interaction_tool(state: AgentState) -> AgentState:
    data = state.get("interaction_data", {})
    chat_text = data.get("chat_text", "")
    
    if chat_text:
        response = llm.invoke([
            SystemMessage(content="""You are an AI assistant for a pharmaceutical CRM system.
            Extract interaction details from the text and return a JSON with these fields:
            hcp_name, interaction_type, topics_discussed, sentiment (Positive/Neutral/Negative),
            outcomes, follow_up_actions, materials_shared, samples_distributed.
            Also provide an ai_summary of the interaction."""),
            HumanMessage(content=f"Extract details from this interaction: {chat_text}")
        ])
        state["tool_result"] = response.content
    else:
        state["tool_result"] = "Interaction logged successfully from form data."
    
    state["tool_name"] = "log_interaction"
    return state

def edit_interaction_tool(state: AgentState) -> AgentState:
    data = state.get("interaction_data", {})
    response = llm.invoke([
        SystemMessage(content="You are a CRM assistant. Confirm the interaction update and suggest any improvements."),
        HumanMessage(content=f"Update interaction with these changes: {data}")
    ])
    state["tool_result"] = response.content
    state["tool_name"] = "edit_interaction"
    return state

def get_hcp_suggestions_tool(state: AgentState) -> AgentState:
    data = state.get("interaction_data", {})
    hcp_name = data.get("hcp_name", "the HCP")
    response = llm.invoke([
        SystemMessage(content="You are a pharmaceutical sales AI assistant. Provide follow-up suggestions for field representatives."),
        HumanMessage(content=f"Suggest follow-up actions for next meeting with {hcp_name} in oncology product discussion.")
    ])
    state["tool_result"] = response.content
    state["tool_name"] = "get_hcp_suggestions"
    return state

def analyze_sentiment_tool(state: AgentState) -> AgentState:
    data = state.get("interaction_data", {})
    topics = data.get("topics_discussed", "")
    response = llm.invoke([
        SystemMessage(content="You are a sentiment analysis expert for pharmaceutical sales interactions."),
        HumanMessage(content=f"Analyze the sentiment and engagement level from this HCP interaction: {topics}")
    ])
    state["tool_result"] = response.content
    state["tool_name"] = "analyze_sentiment"
    return state

def summarize_interaction_tool(state: AgentState) -> AgentState:
    data = state.get("interaction_data", {})
    response = llm.invoke([
        SystemMessage(content="You are a medical sales CRM assistant. Create a concise professional summary."),
        HumanMessage(content=f"Summarize this HCP interaction for CRM records: {data}")
    ])
    state["tool_result"] = response.content
    state["tool_name"] = "summarize_interaction"
    return state

def route_tool(state: AgentState) -> str:
    tool_name = state.get("tool_name", "log_interaction")
    tools = {
        "log_interaction": "log_interaction",
        "edit_interaction": "edit_interaction",
        "get_hcp_suggestions": "get_hcp_suggestions",
        "analyze_sentiment": "analyze_sentiment",
        "summarize_interaction": "summarize_interaction"
    }
    return tools.get(tool_name, END)

def select_tool(state: AgentState) -> AgentState:
    return state

workflow = StateGraph(AgentState)

workflow.add_node("select_tool", select_tool)
workflow.add_node("log_interaction", log_interaction_tool)
workflow.add_node("edit_interaction", edit_interaction_tool)
workflow.add_node("get_hcp_suggestions", get_hcp_suggestions_tool)
workflow.add_node("analyze_sentiment", analyze_sentiment_tool)
workflow.add_node("summarize_interaction", summarize_interaction_tool)

workflow.set_entry_point("select_tool")

workflow.add_conditional_edges(
    "select_tool",
    route_tool,
    {
        "log_interaction": "log_interaction",
        "edit_interaction": "edit_interaction",
        "get_hcp_suggestions": "get_hcp_suggestions",
        "analyze_sentiment": "analyze_sentiment",
        "summarize_interaction": "summarize_interaction"
    }
)

workflow.add_edge("log_interaction", END)
workflow.add_edge("edit_interaction", END)
workflow.add_edge("get_hcp_suggestions", END)
workflow.add_edge("analyze_sentiment", END)
workflow.add_edge("summarize_interaction", END)

agent = workflow.compile()

def run_agent(tool_name: str, interaction_data: dict) -> str:
    result = agent.invoke({
        "messages": [],
        "interaction_data": interaction_data,
        "tool_result": "",
        "tool_name": tool_name
    })
    return result["tool_result"]