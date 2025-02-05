import { ChatPromptTemplate } from '@langchain/core/prompts'
import { BaseAgent } from './_baseAgent'

export class WriterAgent extends BaseAgent {
  constructor(model) {
    super(model)
    this.tools = []
    this.prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'Make a news article formatted in markdown from the given data. You should write the title at the start of your response like this example (#your title here). Use the structure of a news article and use the least amount of headers as possible. Be as neutral as possible. Make the content engaging and informative for the reader. It should be about 6 paragraphs long.',
      ],
      ['human', '{input}'],
      ['assistant', '{agent_scratchpad}'],
    ])
  }

  async init() {
    await this.createAgent()
    return this
  }

  async execute(input) {
    return this.executor.invoke(input)
  }
}
