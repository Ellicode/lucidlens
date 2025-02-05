import { BraveSearch } from '@langchain/community/tools/brave_search'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { BaseAgent } from './_baseAgent'

export class SearchAgent extends BaseAgent {
  constructor(model, apiKey) {
    super(model)
    this.tools = [new BraveSearch({ apiKey })]
    this.prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'Search the web for latest news about the given topic to create a news article. Give the sources of the data. Use a lot of different sources to make the article as neutral as possible.',
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
