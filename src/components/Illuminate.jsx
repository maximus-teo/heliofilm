import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, PanelLeftClose, PanelLeft, Plus, Sparkles, Film } from "lucide-react";
import "./Illuminate.css";

// Tokenizes and renders inline markdown elements (bold, italic, code, links)
function renderInline(text) {
    if (!text) return "";

    // Start with a single text token
    let tokens = [{ type: "text", value: text }];

    // 1. Parse inline code: `code`
    tokens = tokens.flatMap((token) => {
        if (token.type !== "text") return token;
        const parts = token.value.split(/`([^`]+)`/g);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return { type: "code", value: part };
            }
            return { type: "text", value: part };
        });
    });

    // 2. Parse bold text: **text**
    tokens = tokens.flatMap((token) => {
        if (token.type !== "text") return token;
        const parts = token.value.split(/\*\*([^*]+)\*\*/g);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return { type: "bold", value: part };
            }
            return { type: "text", value: part };
        });
    });

    // 3. Parse italic text: *text*
    tokens = tokens.flatMap((token) => {
        if (token.type !== "text") return token;
        const parts = token.value.split(/\*([^*]+)\*/g);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return { type: "italic", value: part };
            }
            return { type: "text", value: part };
        });
    });

    // 4. Parse hyperlinks: [text](url)
    tokens = tokens.flatMap((token) => {
        if (token.type !== "text") return token;
        const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        let lastIndex = 0;
        const result = [];

        while ((match = regex.exec(token.value)) !== null) {
            if (match.index > lastIndex) {
                result.push({
                    type: "text",
                    value: token.value.substring(lastIndex, match.index),
                });
            }
            result.push({ type: "link", text: match[1], url: match[2] });
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < token.value.length) {
            result.push({ type: "text", value: token.value.substring(lastIndex) });
        }
        return result;
    });

    // Convert parsed tokens into React elements
    return tokens.map((token, idx) => {
        switch (token.type) {
            case "code":
                return (
                    <code key={idx} className="inline-code">
                        {token.value}
                    </code>
                );
            case "bold":
                return <strong key={idx}>{token.value}</strong>;
            case "italic":
                return <em key={idx}>{token.value}</em>;
            case "link":
                return (
                    <a
                        key={idx}
                        href={token.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="markdown-link"
                    >
                        {token.text}
                    </a>
                );
            default:
                return token.value;
        }
    });
}

// Custom Markdown block parser
function MarkdownMessage({ content }) {
    if (!content) return null;

    const lines = content.split("\n");
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // 1. Code Blocks (```language ... ```)
        if (line.trim().startsWith("```")) {
            const match = line.trim().match(/^```(\w*)/);
            const language = match ? match[1] : "";
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // Skip closing ```
            blocks.push({
                type: "code_block",
                language,
                code: codeLines.join("\n"),
            });
            continue;
        }

        // 2. Tables (| Header | ...)
        if (line.trim().startsWith("|")) {
            const tableLines = [];
            while (i < lines.length && lines[i].trim().startsWith("|")) {
                tableLines.push(lines[i]);
                i++;
            }

            if (tableLines.length >= 2) {
                const headers = tableLines[0]
                    .split("|")
                    .slice(1, -1)
                    .map((h) => h.trim());

                // Skip tableLines[1] because it is the divider: | --- |
                const rows = tableLines.slice(2).map((rowLine) => {
                    return rowLine
                        .split("|")
                        .slice(1, -1)
                        .map((cell) => cell.trim());
                });

                blocks.push({
                    type: "table",
                    headers,
                    rows,
                });
            } else {
                // Fallback if formatting was malformed
                tableLines.forEach((l) => {
                    blocks.push({ type: "paragraph", text: l });
                });
            }
            continue;
        }

        // 3. Headings (# h1, ## h2, ### h3, etc.)
        if (line.trim().startsWith("#")) {
            const match = line.trim().match(/^(#{1,6})\s+(.*)$/);
            if (match) {
                blocks.push({
                    type: "heading",
                    level: match[1].length,
                    text: match[2],
                });
                i++;
                continue;
            }
        }

        // 4. Unordered Lists (- item or * item)
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const listItems = [];
            while (
                i < lines.length &&
                (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))
            ) {
                // Extract bullet content
                listItems.push(lines[i].trim().substring(2));
                i++;
            }
            blocks.push({
                type: "unordered_list",
                items: listItems,
            });
            continue;
        }

        // 5. Ordered Lists (1. item)
        if (/^\d+\.\s+/.test(line.trim())) {
            const listItems = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
                const match = lines[i].trim().match(/^\d+\.\s+(.*)$/);
                if (match) {
                    listItems.push(match[1]);
                }
                i++;
            }
            blocks.push({
                type: "ordered_list",
                items: listItems,
            });
            continue;
        }

        // 6. Skip empty lines
        if (line.trim() === "") {
            i++;
            continue;
        }

        // 7. Group consecutive standard text lines as a paragraph
        const paraLines = [];
        while (
            i < lines.length &&
            lines[i].trim() !== "" &&
            !lines[i].trim().startsWith("```") &&
            !lines[i].trim().startsWith("|") &&
            !lines[i].trim().startsWith("#") &&
            !lines[i].trim().startsWith("- ") &&
            !lines[i].trim().startsWith("* ") &&
            !/^\d+\.\s+/.test(lines[i].trim())
        ) {
            paraLines.push(lines[i].trim());
            i++;
        }
        blocks.push({
            type: "paragraph",
            text: paraLines.join(" "),
        });
    }

    return (
        <div className="markdown-content">
            {blocks.map((block, idx) => {
                switch (block.type) {
                    case "code_block":
                        return (
                            <pre key={idx} className="code-block">
                                {block.language && (
                                    <div className="code-block-header">{block.language}</div>
                                )}
                                <code className="code-block-body">{block.code}</code>
                            </pre>
                        );
                    case "table":
                        return (
                            <div key={idx} className="table-wrapper">
                                <table className="markdown-table">
                                    <thead>
                                        <tr>
                                            {block.headers.map((h, hIdx) => (
                                                <th key={hIdx}>{renderInline(h)}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {block.rows.map((row, rIdx) => (
                                            <tr key={rIdx}>
                                                {row.map((cell, cIdx) => (
                                                    <td key={cIdx}>{renderInline(cell)}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    case "heading": {
                        const HeadingTag = `h${Math.min(block.level, 6)}`;
                        return (
                            <HeadingTag key={idx} className={`markdown-h${block.level}`}>
                                {renderInline(block.text)}
                            </HeadingTag>
                        );
                    }
                    case "unordered_list":
                        return (
                            <ul key={idx} className="markdown-ul">
                                {block.items.map((item, itemIdx) => (
                                    <li key={itemIdx}>{renderInline(item)}</li>
                                ))}
                            </ul>
                        );
                    case "ordered_list":
                        return (
                            <ol key={idx} className="markdown-ol">
                                {block.items.map((item, itemIdx) => (
                                    <li key={itemIdx}>{renderInline(item)}</li>
                                ))}
                            </ol>
                        );
                    case "paragraph":
                        return (
                            <p key={idx} className="markdown-p">
                                {renderInline(block.text)}
                            </p>
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
}

// Pre-defined high-quality cinematic response data
const MOCK_ANSWERS = {
    interstellar: `### Thematic Breakdown: Christopher Nolan's *Interstellar* (2014)

Christopher Nolan's *Interstellar* is a modern science fiction masterpiece that blends hard physics with deep emotional human truth. Here are the core themes:

#### 1. Love as a Measurable Dimension
The film suggests that **love** is not just an emotional response but a tangible force that transcends time and space.
* Cooper's connection to Murph guides him through the Tesseract.
* Brand's speech about love suggests it is an artifact of a higher dimension we cannot yet perceive.

#### 2. Time & Sacrifice
Time is the ultimate antagonist in the film. Because of gravitational time dilation:
* A few hours on Miller's Planet equals *23 years* on Earth.
* Cooper suffers the tragedy of watching his children grow up through video logs in minutes.

#### 3. Environmental Hubris & Survival
* The film starts in a dying Dust Bowl.
* Earth is portrayed as a cradle, but not a permanent home: *"We are not meant to save the world. We are meant to leave it."*

#### Key Planet Comparison
| Planet | Time Dilation Effect | Primary Threat | Scientific Concept |
| :--- | :--- | :--- | :--- |
| **Miller's Planet** | 1 Hour = 7 Earth Years | Giant Tidal Waves | Relativistic Gravity (Gargantua) |
| **Mann's Planet** | 1:1 Normal Time | Frozen Ammonia Clouds | Hostile Habitability |
| **Edmunds' Planet** | 1:1 Normal Time | None (Viable) | Colonization Potential |

For more technical details on the science behind the film, refer to [Kip Thorne's Science of Interstellar](https://www.youtube.com/watch?v=co7MKG1bU7o).`,

    shutter: `### Shutter Island (2010): Ending Explained

The climax of Martin Scorsese's *Shutter Island* reveals that **Teddy Daniels** (Leonardo DiCaprio) is actually **Andrew Laeddis**, the most dangerous patient at Ashecliffe Hospital, committed after killing his manic-depressive wife, who drowned their three children.

#### The Roleplay Experiment
The entire investigation was a massive roleplay organized by **Dr. John Cawley** and **Dr. Lester Sheehan** (who played "Chuck Aule"):
- **Goal:** To let Andrew act out his conspiracy theory fantasy in the hope that encountering its logical impossibility would break his delusion permanently.
- **Alternative:** If he failed to accept reality, the board of directors would approve a radical lobotomy.

#### The Tragedy of the Ending
In the final scene on the steps, Andrew speaks to Sheehan:
> *"Which would be worse: to live as a monster, or to die as a good man?"*

#### What it means:
Andrew **does** realize the truth, but cannot bear the guilt of his actions. He pretends to regress back into his delusion so that the doctors will lobotomize him, effectively choosing to erase his painful memory.

#### Character Overview
| Real Identity | Delusional Identity | Dr. Cawley's Diagnosis |
| :--- | :--- | :--- |
| Andrew Laeddis | Edward "Teddy" Daniels | Severe schizophrenia with post-traumatic guilt |
| Dolores Chanal | Rachel Solando (wife) | Manic-depression / Psychosis |
| Dr. Lester Sheehan | Chuck Aule (partner) | Primary treating psychiatrist |`,

    scifi: `### Recommended Science Fiction Masterpieces

If you enjoyed cerebral science fiction, here are five highly recommended screenings to explore:

1. **Inception (2010)**
   - **Director:** Christopher Nolan
   - **Rating:** 8.8/10
   - **Core Concept:** Corporate espionage inside nested dream landscapes.

2. **Blade Runner 2049 (2017)**
   - **Director:** Denis Villeneuve
   - **Rating:** 8.4/10
   - **Core Concept:** Existential investigation into artificial consciousness and memory.

3. **Arrival (2016)**
   - **Director:** Denis Villeneuve
   - **Rating:** 8.0/10
   - **Core Concept:** Linguistics, non-linear time, and first contact.

4. **The Matrix (1999)**
   - **Director:** The Wachowskis
   - **Rating:** 8.7/10
   - **Core Concept:** A hacker discovers our reality is a simulated prison.

5. **Ex Machina (2014)**
   - **Director:** Alex Garland
   - **Rating:** 7.7/10
   - **Core Concept:** A Turing test conducted on an advanced humanoid robot.

Check out the latest trailer links and details in our [Browse Section](/browse).`,

    generic: `### Illuminate AI Cinematic Assistant

I've analyzed your question about **cinema studies**. Let's review the analytical breakdown of this topic:

#### Core Analysis Parameters
| Analytical Layer | Focal Points | Importance |
| :--- | :--- | :--- |
| Narrative Archetypes | Character Arcs, Motifs | High |
| Cinematography | Lighting, Lens Selection, Color Palettes | High |
| Directorial Style | Editing Pace, Mise-en-scène | Medium |
| Structural Screenplays | Three-Act Structure, Pacing | High |

#### Next Steps to Explore
- **Browse Tab:** Check current cinema listings and popular releases.
- **Search Bar:** Type in specific movie names to look up ratings and runtimes.
- **Documentation:** Visit [Heliofilm Developer Tools](https://github.com) for backend API guidelines.

*Let me know if you would like me to detail a specific film or analysis!*`,
};

export default function Illuminate() {
    const [conversations, setConversations] = useState([
        {
            id: "demo-1",
            title: "Interstellar Theme Analysis",
            messages: [
                { id: "m1", sender: "user", text: "Analyze the core thematic elements of Christopher Nolan's Interstellar." },
                { id: "m2", sender: "bot", text: MOCK_ANSWERS.interstellar },
            ],
        },
        {
            id: "demo-2",
            title: "Shutter Island Resolution",
            messages: [
                { id: "m3", sender: "user", text: "Explain the complex dream levels and ending of Shutter Island." },
                { id: "m4", sender: "bot", text: MOCK_ANSWERS.shutter },
            ],
        },
    ]);

    const [activeSessionId, setActiveSessionId] = useState("");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Suggested starters
    const suggestions = [
        {
            title: "Theme Analysis",
            desc: "Interstellar's scientific & human motifs",
            prompt: "Analyze the core thematic elements of Christopher Nolan's Interstellar.",
            key: "interstellar",
        },
        {
            title: "Explain Ending",
            desc: "Shutter Island's twist & psychological fate",
            prompt: "Explain the complex dream levels and ending of Shutter Island.",
            key: "shutter",
        },
        {
            title: "Sci-Fi Scripts",
            desc: "Recommend 5 critically acclaimed screenplays",
            prompt: "Recommend 5 critically acclaimed Sci-Fi screenplays with high ratings.",
            key: "scifi",
        },
        {
            title: "Cinematography",
            desc: "How lighting tells a story on screen",
            prompt: "Explain how cinematography and color palettes influence narrative pacing.",
            key: "generic",
        },
    ];

    // Load conversation details when active session changes
    useEffect(() => {
        if (activeSessionId) {
            const active = conversations.find((c) => c.id === activeSessionId);
            if (active) {
                setMessages(active.messages);
            }
        } else {
            setMessages([]);
        }
    }, [activeSessionId, conversations]);

    // Textarea auto-resize as user types
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(
                textareaRef.current.scrollHeight,
                200
            )}px`;
        }
    }, [input]);

    // Auto-scroll to the bottom of the conversation on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    const handleSend = (textToSend) => {
        const text = textToSend || input;
        if (!text.trim() || isLoading) return;

        const userMsg = {
            id: `u-${Date.now()}`,
            sender: "user",
            text: text.trim(),
        };

        let sessionToUpdateId = activeSessionId;
        let updatedConversations = [...conversations];

        // If starting a fresh chat session, create a new conversation in history
        if (!activeSessionId) {
            const newSessionId = `s-${Date.now()}`;
            const title = text.length > 25 ? `${text.substring(0, 25)}...` : text;
            const newSession = {
                id: newSessionId,
                title: title,
                messages: [userMsg],
            };
            updatedConversations = [newSession, ...updatedConversations];
            setConversations(updatedConversations);
            setActiveSessionId(newSessionId);
            sessionToUpdateId = newSessionId;
        } else {
            // Add message to current active conversation
            updatedConversations = conversations.map((c) => {
                if (c.id === activeSessionId) {
                    return { ...c, messages: [...c.messages, userMsg] };
                }
                return c;
            });
            setConversations(updatedConversations);
        }

        setInput("");
        setIsLoading(true);

        // Simulate chatbot backend delays
        setTimeout(() => {
            // Find matching mock response, default to generic
            let replyText = MOCK_ANSWERS.generic;
            const normalizedText = text.toLowerCase();

            if (normalizedText.includes("interstellar")) {
                replyText = MOCK_ANSWERS.interstellar;
            } else if (normalizedText.includes("shutter island")) {
                replyText = MOCK_ANSWERS.shutter;
            } else if (normalizedText.includes("sci-fi") || normalizedText.includes("scifi") || normalizedText.includes("recommend")) {
                replyText = MOCK_ANSWERS.scifi;
            }

            const botMsg = {
                id: `b-${Date.now()}`,
                sender: "bot",
                text: replyText,
            };

            setConversations((prev) =>
                prev.map((c) => {
                    if (c.id === sessionToUpdateId) {
                        return { ...c, messages: [...c.messages, botMsg] };
                    }
                    return c;
                })
            );
            setIsLoading(false);
        }, 1200);
    };

    const handleKeyDown = (e) => {
        // Submit on Enter (unless Shift key is held down)
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewChat = () => {
        setActiveSessionId("");
        setMessages([]);
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    return (
        <div className="chat-container">
            {/* Collapsible Left History Sidebar */}
            <aside className={`chat-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    <button className="new-chat-btn" onClick={handleNewChat}>
                        <Plus size={16} />
                        <span>New Chat</span>
                    </button>
                </div>
                <div className="history-container">
                    <span className="history-title">Recent Investigations</span>
                    {conversations.map((c) => (
                        <button
                            key={c.id}
                            className={`history-item ${activeSessionId === c.id ? "active" : ""}`}
                            onClick={() => setActiveSessionId(c.id)}
                        >
                            <MessageSquare size={14} />
                            <span>{c.title}</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Chat Assistant Area */}
            <main className="chat-main">
                {/* Chat Control Header */}
                <header className="chat-header">
                    <div className="header-left">
                        <button
                            className="icon-btn"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
                        </button>
                        <span className="header-title">Illuminate Assistant</span>
                    </div>
                </header>

                {/* Scrollable Conversation Container */}
                <div className="messages-container">
                    {messages.length === 0 ? (
                        /* Welcome / Initial Empty State */
                        <div className="welcome-container">
                            <div className="welcome-title-group">
                                <h2 className="welcome-title">Illuminate Cinematic Intelligence</h2>
                                <p className="welcome-subtitle">
                                    Analyze narratives, dissect cinematography motifs, and explore screenplay theories. Where does your curiosity lead today?
                                </p>
                            </div>

                            <div className="suggestions-grid">
                                {suggestions.map((s, idx) => (
                                    <div
                                        key={idx}
                                        className="suggestion-card"
                                        onClick={() => handleSend(s.prompt)}
                                    >
                                        <span className="suggestion-card-title">{s.title}</span>
                                        <span className="suggestion-card-prompt">{s.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Active Message Bubbles List */
                        <div className="messages-list">
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`message-row ${m.sender === "user" ? "user-row" : "bot-row"
                                        }`}
                                >
                                    {m.sender === "bot" && (
                                        <div className="bot-avatar">
                                            <Sparkles size={16} />
                                        </div>
                                    )}
                                    <div
                                        className={`message-bubble ${m.sender === "user" ? "user-bubble" : "bot-bubble"
                                            }`}
                                    >
                                        {m.sender === "user" ? (
                                            /* Plain text with preserve whitespace for user queries */
                                            <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                                        ) : (
                                            /* Rich rendering using custom markdown node engine */
                                            <MarkdownMessage content={m.text} />
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Bot Loading typing indicator */}
                            {isLoading && (
                                <div className="message-row bot-row">
                                    <div className="bot-avatar">
                                        <Film size={16} />
                                    </div>
                                    <div className="message-bubble bot-bubble">
                                        <div className="typing-container">
                                            <div className="typing-dots">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Dummy anchor to scroll back to bottom */}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input box Sticky to bottom */}
                <div className="input-wrapper">
                    <div className="input-box">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            className="chat-textarea"
                            placeholder="Ask Illuminate about cinema studies..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            className="send-btn"
                            disabled={!input.trim() || isLoading}
                            onClick={() => handleSend()}
                            aria-label="Send message"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                    <span className="input-disclaimer">
                        Illuminate analysis is derived from film studies & metadata. Double-check major screenplay facts.
                    </span>
                </div>
            </main>
        </div>
    );
}