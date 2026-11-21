
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver

# ==========================================
# 1. SETUP & PATH RESOLUTION
# ==========================================

script_dir = Path(__file__).resolve().parent
project_root = script_dir.parent

if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

load_dotenv(project_root / ".env")

from src.agent_tools import (
    query_telemetry_db,
    fetch_corridor_conditions,
    search_compliance_sop
)


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


# ==========================================
# 2. FACTORY INITIALIZATION: AGENT REASONER LLM
# ==========================================

AGENT_LLM_SETTING = os.getenv("Agent_llm", "GROQ").strip().upper()

# ------------------------------------------
# OPTION 1: OPENAI
# ------------------------------------------

if AGENT_LLM_SETTING == "OPENAI":

    print("🤖 Brain Mode: Utilizing OpenAI GPT-4o...")

    from langchain_openai import ChatOpenAI

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise ValueError("OPENAI_API_KEY is missing from .env")

    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0,
        api_key=api_key
    )


# ------------------------------------------
# OPTION 2: DEEPSEEK
# ------------------------------------------

elif AGENT_LLM_SETTING == "DEEPSEEK":

    print("🐳 Brain Mode: Utilizing DeepSeek Cloud Reasoner...")

    from langchain_openai import ChatOpenAI

    api_key = os.getenv("DEEPSEEK_API_KEY")

    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY is missing from .env")

    llm = ChatOpenAI(
        model="deepseek-chat",
        temperature=0,
        api_key=api_key,
        base_url="https://api.deepseek.com",
        max_tokens=2048
    )


# ------------------------------------------
# OPTION 3: GROQ
# ------------------------------------------

elif AGENT_LLM_SETTING == "GROQ":

    print("⚡ Brain Mode: Utilizing Groq Cloud Reasoner...")

    from langchain_groq import ChatGroq

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise ValueError("GROQ_API_KEY is missing from .env")

    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=0,
        api_key=api_key,
        max_tokens=2048
    )


# ------------------------------------------
# OPTION 4: OLLAMA LOCAL FALLBACK
# ------------------------------------------

elif AGENT_LLM_SETTING == "OLLAMA":

    print("🤗 Brain Mode: Utilizing Local Ollama (qwen2.5:7b)...")

    from langchain_ollama import ChatOllama

    llm = ChatOllama(
        model="qwen2.5:7b",
        temperature=0,
        num_predict=1024
    )


else:
    raise ValueError(
        f"Unsupported Agent_llm setting: {AGENT_LLM_SETTING}. "
        "Choose GROQ, OPENAI, DEEPSEEK, or OLLAMA."
    )


# ==========================================
# 3. TOOL REGISTRATION
# ==========================================

fde_tools = [
    query_telemetry_db,
    fetch_corridor_conditions,
    search_compliance_sop
]

print("🔧 Registering FDE Agent Tools...")

llm_with_tools = llm.bind_tools(fde_tools)


# ==========================================
# 4. LANGGRAPH REASONING NODE
# ==========================================

def reasoning_node(state: AgentState):

    response = llm_with_tools.invoke(state["messages"])

    return {
        "messages": [response]
    }


# ==========================================
# 5. GRAPH ARCHITECTURE ASSEMBLY
# ==========================================

print("⚙️ Compiling LangGraph FDE Orchestrator...")

graph_builder = StateGraph(AgentState)

graph_builder.add_node("reasoner", reasoning_node)

graph_builder.add_node(
    "tools",
    ToolNode(fde_tools)
)

graph_builder.add_edge(START, "reasoner")

graph_builder.add_conditional_edges(
    "reasoner",
    tools_condition
)

graph_builder.add_edge(
    "tools",
    "reasoner"
)

fde_agent = graph_builder.compile(
    checkpointer=MemorySaver()
)


# ==========================================
# 6. CHAT LOOP TESTING PANEL
# ==========================================

if __name__ == "__main__":

    print("\n" + "=" * 60)

    print("🚀 FDE SUPPLY CHAIN ORCHESTRATOR ONLINE")

    print(f"   Active LLM: {AGENT_LLM_SETTING}")

    print(
        f"   Embeddings: "
        f"{os.getenv('Embeddings_model', 'LOCAL')}"
    )

    print("=" * 60 + "\n")


    # --------------------------------------
    # LOAD SYSTEM PROMPT
    # --------------------------------------

    prompt_path = (
        project_root
        / "src"
        / "prompts"
        / "system_prompt.txt"
    )

    try:

        with open(prompt_path, "r", encoding="utf-8") as f:
            system_instructions = f.read()

    except FileNotFoundError:

        print(f"Warning: System prompt not found: {prompt_path}")

        system_instructions = (
            "You are a helpful AI Logistics Assistant. "
            "Use available tools to answer logistics questions."
        )


    system_prompt = SystemMessage(
        content=system_instructions
    )


    # --------------------------------------
    # INITIALIZE AGENT MEMORY
    # --------------------------------------

    thread_config = {
        "configurable": {
            "thread_id": "production_test_1"
        }
    }

    fde_agent.invoke(
        {"messages": [system_prompt]},
        config=thread_config
    )


    # --------------------------------------
    # INTERACTIVE CHAT LOOP
    # --------------------------------------

    print("Agent ready. Type 'exit' to stop.")

    while True:

        try:

            user_input = input("\nDispatcher > ").strip()

            if user_input.lower() in ["exit", "quit"]:
                print("FDE Agent shutting down. Goodbye!")
                break

            if not user_input:
                continue


            events = fde_agent.stream(
                {"messages": [("user", user_input)]},
                config=thread_config,
                stream_mode="updates"
            )


            for event in events:

                for node_name, node_state in event.items():

                    if node_name == "tools":

                        print(
                            "\n[System] 🔄 "
                            "Retrieving external logistics data..."
                        )

                    elif node_name == "reasoner":

                        latest_msg = node_state["messages"][-1]

                        if latest_msg.content:

                            print(
                                f"\n🤖 FDE Agent:\n"
                                f"{latest_msg.content}"
                            )

        except KeyboardInterrupt:

            print("\nAgent stopped by user.")
            break

        except Exception as error:

            print(f"\n[Agent Error] {error}")
