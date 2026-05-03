import { AiProvider } from "./AiProvider";
import { GroqProvider } from "./providers/GroqProvider";

export class AiServiceFactory {
  static getProvider(): AiProvider {
    // Aqui você pode mudar para GeminiProvider, OpenAIProvider etc futuramente
    // Pode inclusive ler de uma variável de ambiente: process.env.AI_PROVIDER
    return new GroqProvider();
  }
}
