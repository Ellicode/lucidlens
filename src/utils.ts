export const convertMarkdownToHtml = (markdown: string): string => {
  const rules = [
    { regex: /###### (.*$)/gim, replacement: '<h6 class="text-base font-semibold">$1</h6>' },
    { regex: /##### (.*$)/gim, replacement: '<h5 class="text-lg font-semibold">$1</h5>' },
    { regex: /#### (.*$)/gim, replacement: '<h4 class="text-xl font-semibold">$1</h4>' },
    { regex: /### (.*$)/gim, replacement: '<h3 class="text-2xl font-semibold">$1</h3>' },
    { regex: /## (.*$)/gim, replacement: '<h2 class="text-3xl font-semibold">$1</h2>' },
    { regex: /# (.*$)/gim, replacement: '<h1 class="text-4xl font-semibold">$1</h1>' },
    { regex: /\*\*(.*)\*\*/gim, replacement: '<b class="font-bold">$1</b>' },
    { regex: /\*(.*)\*/gim, replacement: '<i class="italic">$1</i>' },
    { regex: /!\[(.*?)\]\((.*?)\)/gim, replacement: '<img class="my-4" alt="$1" src="$2" />' },
    {
      regex: /\[(.*?)\]\((.*?)\)/gim,
      replacement: '<a class="text-blue-500 underline" href="$2">$1</a>',
    },
    { regex: /\n/gim, replacement: '</p><p class="my-5">' }, // Add support for <p> tags
  ]

  return `<p class="my-5">${rules.reduce((acc, rule) => acc.replace(rule.regex, rule.replacement), markdown)}</p>`
}
