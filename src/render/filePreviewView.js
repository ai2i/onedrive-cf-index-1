import marked from 'marked'

import { renderHTML } from './htmlWrapper'
import { renderPath } from './pathUtil'

import { preview, extensions } from './fileExtension'

async function renderTextPreview(file) {
  const resp = await fetch(file['@microsoft.graph.downloadUrl'])
  const content = await resp.text()
  const parseText = txt => {
    let finalText = ''
    txt.split('\n').forEach(t => {
      finalText += `<p>${t}</p>`
    })
    return finalText
  }
  return `<div class="markdown-body" style="margin-top: 0;">
            ${parseText(content)}
          </div>`
}

async function renderMarkdownPreview(file) {
  const resp = await fetch(file['@microsoft.graph.downloadUrl'])
  const content = await resp.text()

  const renderedMd = marked(content)
  return `<div class="markdown-body" style="margin-top: 0;">
            ${renderedMd}
          </div>`
}

async function renderCodePreview(file, lang) {
  const resp = await fetch(file['@microsoft.graph.downloadUrl'])
  const content = await resp.text()
  const toMarkdown = `\`\`\`${lang}\n${content}\n\`\`\``
  const renderedCode = marked(toMarkdown)
  return `<div class="markdown-body" style="margin-top: 0;">
            ${renderedCode}
          </div>`
}

function renderPDFPreview(file) {
  return '<p>PDF preview online is work in progress.</p>'
}

function renderImage(file) {
  // See: https://github.com/verlok/vanilla-lazyload#occupy-space-and-avoid-content-reflow
  const ratio = (file.image.height / file.image.width) * 100
  return `<div class="image-wrapper" style="width: 100%; height: 0; padding-bottom: ${ratio}%; position: relative;">
            <img data-zoomable src="${file['@microsoft.graph.downloadUrl']}" alt="${file.name}" style="width: 100%; height: auto; position: absolute;"></img>
          </div>`
}

async function renderPreview(file, fileExt) {
  switch (extensions[fileExt]) {
    case preview.markdown:
      return await renderMarkdownPreview(file)

    case preview.text:
      return await renderTextPreview(file)

    case preview.image:
      return renderImage(file)

    case preview.code:
      return await renderCodePreview(file, fileExt)

    case preview.pdf:
      return renderPDFPreview(file)

    default:
      return Response.redirect(file['@microsoft.graph.downloadUrl'], 302)
  }
}

export async function renderFilePreview(file, path, fileExt) {
  const nav = '<nav><div class="brand">📁 Spencer\'s OneDrive Index</div></nav>'
  const el = (tag, attrs, content) => `<${tag} ${attrs.join(' ')}>${content}</${tag}>`
  const div = (className, content) => el('div', [`class=${className}`], content)

  const body =
    nav +
    div(
      'container',
      div('path', renderPath(path) + ` / ${file.name}`) +
        div('items', el('div', ['style="padding: 1rem 1rem;"'], await renderPreview(file, fileExt))) +
        div(
          'download-button-container',
          el(
            'a',
            ['class="download-button"', `href="${file['@microsoft.graph.downloadUrl']}"`],
            '<i class="far fa-arrow-alt-circle-down"></i> DOWNLOAD'
          )
        )
    )
  return renderHTML(body)
}