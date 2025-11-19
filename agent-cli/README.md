# Esmero Agent CLI

Interactive CLI for the Esmero AI Agent - a workflow-based coding assistant that uses intelligent context determination and multi-stage processing.

## Installation

```bash
npm install
```

## Usage

Start the CLI:

```bash
npm start
```

## Architecture

The CLI follows a workflow-based architecture inspired by AI Chef, separating concerns into specialized stages:

```
User Input
    ↓
Command Detection → Execute Command
    ↓
Add to Conversation State
    ↓
Handler
    ↓
Context Determination (message + conversation history)
    ↓
Agent Execution
    ↓
Add Response to State
    ↓
Display & Continue
```

### Key Components

#### 1. **Conversation State** (`state/`)
- Manages conversation history across turns
- Tracks user, agent, and system messages
- Supports conversation manipulation (undo, reset)

#### 2. **Command System** (`commands/`)
- Detects and routes commands (`/help`, `/history`, etc.)
- Executes conversation management operations
- Returns structured results

#### 3. **Context Determination** (`context/`)
- Receives user message + conversation history
- **Future**: Will scan files, classify task type, determine relevant context
- Returns structured context for agent execution

#### 4. **Agent Execution** (`agent/`)
- Receives context (including conversation history)
- **Future**: Will execute intelligent workflow based on task classification
- Returns structured response with actions

#### 5. **Handler** (`handler.ts`)
- Orchestrates the flow: Context → Agent → Result
- Currently passes conversation history to context determination

#### 6. **Main CLI** (`index.ts`)
- Interactive loop with inquirer
- Command detection and routing
- Conversation state management
- UX formatting and error handling

## Available Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/history` | View full conversation history |
| `/back` | Undo last exchange (remove last user+agent messages) |
| `/reset` | Clear conversation and start fresh |
| `/stop` or `/exit` | Exit the CLI |

## Conversation State

The CLI maintains conversation state throughout the session:

- **Messages**: All user, agent, and system messages with timestamps
- **History**: Full conversation history passed to context determination
- **Persistence**: In-memory only (resets on restart)

## Current Status: Mock Implementation

The skeleton is complete with:
- ✅ Interactive CLI with commands
- ✅ Conversation state management
- ✅ Workflow architecture (Handler → Context → Agent)
- ✅ Professional UX (colors, formatting, error handling)

**Next Step**: Build the actual agent logic:
- Context determination (file scanning, task classification)
- Agent workflow execution (intelligent file changes, reasoning)
- Task-specific pipelines (bug fix, feature add, refactor, etc.)

## Design Philosophy

This CLI skeleton is built to support **workflow-based AI agents** rather than simple infinite-context agents:

1. **Context Efficiency**: Only relevant information reaches the agent
2. **Conversation Awareness**: Full history available for intelligent context determination
3. **Specialized Processing**: Different stages handle different concerns
4. **Extensibility**: Easy to add new task types, workflows, and capabilities

## File Structure

```
agent-cli/
├── state/              # Conversation state management
│   ├── types.ts
│   └── ConversationState.ts
├── commands/           # Command system
│   ├── commands.ts
│   └── CommandHandler.ts
├── context/            # Context determination (mock)
│   └── index.ts
├── agent/              # Agent execution (mock)
│   └── index.ts
├── utils/              # UI utilities
│   └── ui.ts
├── handler.ts          # Main orchestration
├── index.ts            # CLI entry point
├── types.ts            # Shared types
└── README.md
```

## Development

The codebase uses:
- **TypeScript** with strict mode
- **ES Modules** (`.js` imports in `.ts` files)
- **tsx** for execution
- **chalk v5** for terminal colors
- **inquirer** for interactive prompts

## Future Enhancements

When building the actual agent:

1. **Context Determination**:
   - Scan project files based on conversation
   - Classify task type (bug fix, feature, refactor)
   - Determine relevant files and dependencies
   - Extract git status, recent changes

2. **Agent Workflows**:
   - Bug fix pipeline (find error → analyze → fix → test)
   - Feature pipeline (understand requirements → plan → implement)
   - Refactor pipeline (identify code → improve → verify)

3. **Multi-Model Strategy**:
   - Different models for different tasks
   - Parallel execution where possible
   - Cost optimization through model selection

## License

ISC