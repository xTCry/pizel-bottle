import * as Fs from 'fs-extra';

export async function readFile(file: string) {
  const filePath = `./dataset/${file}`;
  if (!Fs.existsSync(filePath)) return undefined;
  return (await Fs.readFile(filePath)).toString();
}

export async function pushToFile(file: string, data: string) {
  try {
    await Fs.appendFile(`./dataset/${file}`, `${data}\n`);
  } catch {}
}
