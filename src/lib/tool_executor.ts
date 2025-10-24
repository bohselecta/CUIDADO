export function parseToolCall(text: string): { name: string; args: any } | null {
  try {
    // Look for JSON tool call in the text
    const jsonMatch = text.match(/\{"tool_call":\s*\{[^}]+\}\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.tool_call && parsed.tool_call.name && parsed.tool_call.args) {
      return {
        name: parsed.tool_call.name,
        args: parsed.tool_call.args
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function executeTool(name: string, args: any): Promise<{ ok: boolean; result?: any; error?: string }> {
  try {
    const res = await fetch(`/api/tool/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args)
    });
    
    const data = await res.json();
    return data;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function formatToolResult(result: any): string {
  if (result.ok) {
    return JSON.stringify({ tool_result: result.result });
  } else {
    return JSON.stringify({ tool_error: result.error });
  }
}

export async function processToolCall(text: string): Promise<{ hasToolCall: boolean; toolResult?: string; finalText?: string }> {
  const toolCall = parseToolCall(text);
  
  if (!toolCall) {
    return { hasToolCall: false };
  }
  
  const result = await executeTool(toolCall.name, toolCall.args);
  const toolResult = formatToolResult(result);
  
  return {
    hasToolCall: true,
    toolResult,
    finalText: text // Could be enhanced to remove tool call from text
  };
}
