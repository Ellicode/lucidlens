import { ChatPromptTemplate } from '@langchain/core/prompts'
import { BaseAgent } from './_baseAgent'

export class WriterAgent extends BaseAgent {
  constructor(model) {
    super(model)
    this.tools = []
    this.prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `Make a news article formatted in markdown from the given data.
        You should write the title of the article with a markdown heading like in this example : # Title of the post.
        You should write the description of the article (2 sentences long) with a markdown blockquote like in this example : >>> This is the description of the post.
        Use the structure of a news article.
        Be as neutral as possible.
        Make the content engaging and informative for the reader.
        It should be about 4 paragraphs long.`,
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
