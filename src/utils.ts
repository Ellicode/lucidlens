export const convertMarkdownToHtml = (markdown: string): string => {
  const rules = [
    {
      regex: /#### (.*$)/gim,
      replacement: (_: string, p1: string) => `<h4 class="text-xl my-5 font-serif">${p1}</h4>`,
    },
    {
      regex: /### (.*$)/gim,
      replacement: (_: string, p1: string) => `<h3 class="text-2xl my-5 font-serif">${p1}</h3>`,
    },
    {
      regex: /## (.*$)/gim,
      replacement: (_: string, p1: string) => `<h2 class="text-3xl my-5 font-serif">${p1}</h2>`,
    },
    {
      regex: /# (.*$)/gim,
      replacement: (_: string, p1: string) => `<h1 class="text-4xl my-5 font-serif">${p1}</h1>`,
    },
    {
      regex: /\*\*(.*)\*\*/gim,
      replacement: (_: string, p1: string) => `<b class="font-bold">${p1}</b>`,
    },
    {
      regex: /\_\_(.*?)\_\_/gim,
      replacement: (_: string, p1: string) => `<b class="font-bold">${p1}</b>`,
    },
    { regex: /\*(.*)\*/gim, replacement: (_: string, p1: string) => `<i class="italic">${p1}</i>` },
    {
      regex: /\_(.*?)\_/gim,
      replacement: (_: string, p1: string) => `<i class="italic">${p1}</i>`,
    },
    {
      regex: /~~(.*?)~~/gim,
      replacement: (_: string, p1: string) => `<s class="line-through">${p1}</s>`,
    },
    {
      regex: /`(.*?)`/gim,
      replacement: (_: string, p1: string) =>
        `<code class="bg-gray-100 p-1 text-sm rounded font-mono">${p1}</code>`,
    },
    {
      // Match blockquotes (with a simpler approach)
      regex: /^(>|&gt;)[ ]\s*(.*?)$/gim,
      replacement: (_: string, _p1: string, p2: string) =>
        `<blockquote class="text-lg font-serif px-5 border-l-2 border-neutral-200 my-5 italic">${p2}</blockquote>`,
    },
    {
      regex: /^(\*{3,}|_{3,}|-{3,})$/gim,
      replacement: () => '<p class="my-5 text-center font-serif text-xl">* * *</p>',
    },
    {
      regex: /^(\*{3,}|={3,})$/gim,
      replacement: () => '<hr class="my-5 border-t border-gray-300" />',
    },
    {
      regex: /!\[(.*?)\]\((.*?)\)/gim,
      replacement: (_: string, p1: string, p2: string) =>
        `<img class="my-4" alt="${p1}" src="${p2}" />`,
    },
    {
      regex: /\[(.*?)\]\((.*?)\)/gim,
      replacement: (_: string, p1: string, p2: string) =>
        `<a class="text-blue-500 hover:text-blue-600 hover:underline" href="${p2}">${p1}</a>`,
    },
    { regex: /\n/gim, replacement: () => '</p><p class="mb-5">' }, // Add support for <p> tags
  ]

  return `<p class="mb-5">${rules.reduce((acc, rule) => acc.replace(rule.regex, rule.replacement), markdown.replace('<', '&lt;').replace('>', '&gt;'))}</p>`
}
