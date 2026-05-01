import { api } from "./api";

export const aiAdvisorService = {
  chat: (businessId: number, messages: { role: "user" | "assistant"; content: string }[]) =>
    api.post(`/api/businesses/${businessId}/ai-advisor/chat`, { messages }),
};