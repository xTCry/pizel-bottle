import { readFile } from './fs.util';
import { sololog } from './logger.util';

export async function loadEmbeds(fileName = 'embeds.ini') {
  const dataContent = await readFile(fileName);
  if (!dataContent) {
    sololog.error(`Not found file ./dataset/${fileName}`);
    return [];
  }

  let embedsData: string[] = [];
  const arData = dataContent
    .split('\n')
    .filter(
      (e) => e && e.length > 0 && !e.startsWith('#') && !e.startsWith(';'),
    )
    .map((e) => e.replace(/\r?\n|\r/g, ''));

  if (!arData.length) {
    sololog.warn(`Empty data from ./data/${fileName}`);
    return [];
  }

  for (const data of arData) {
    let embedURL = data.toString().trim();
    // .replace(
    //   'https://prod-app7148888-ZZZZZZZZZZZZ.pages.vk-apps.com',
    //   'https://prod-app7148888-XXXXXXXXXXXX.pages.vk-apps.com',
    // );
    embedsData.push(embedURL);
  }

  return embedsData;
}
