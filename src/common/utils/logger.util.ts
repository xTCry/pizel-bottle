import * as ololog from 'ololog';
import * as ansi from 'ansicolor';
import * as RFS from 'rotating-file-stream';
import * as printableCharacters from 'printable-characters';
import * as StackTracey from 'stacktracey';
import * as bullet from 'string.bullet';
import * as stringify from 'string.ify';

import { Logger as LoggerType } from '@bottle/pixel/interface';
import { LOG_PATH } from '@my-environment';

export type StreamWriter = { write: (chunk: any) => void };

export const changeLastNonEmptyLine = (
  lines: string[],
  fn: (line: string) => string,
) => {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (i === 0 || !printableCharacters.isBlank(lines[i])) {
      lines[i] = fn(lines[i]);
      break;
    }
  }
  return lines;
};

export const customLocator = (
  lines: string[],
  {
    shift = 0,
    where = new StackTracey().clean().at(1 + shift),
    join = (a, sep, b) => (a && b ? a + sep + b : a || b),
    print = ({ calleeShort, fileName = '', line = 0 }: StackTracey.Entry) =>
      ansi.darkGray(
        '(' + join(calleeShort, ' @ ', join(fileName, ':', line)) + ')',
      ),
  },
) =>
  changeLastNonEmptyLine(lines, (line: string) =>
    join(line, ' ', print(where)),
  );

/**
 * Logger to file system
 */
export class LoggerFS {
  public accessLogStream: Map<string, StreamWriter> = new Map();

  private options: RFS.Options;

  constructor(
    options: RFS.Options = {
      size: '1M',
      interval: '2h',
    },
  ) {
    this.options = options;
  }

  public getStream(fileName: string) {
    if (!this.accessLogStream.has(fileName)) {
      const stream = this.createBufferStream(
        RFS.createStream(this.createNameGenerator(fileName), {
          path: LOG_PATH,
          // immutable: true,
          ...this.options,
        }),
      );
      stream.write(`\n${new Date().toLocaleString()}\tNEW_LAUNCH\n`);
      this.accessLogStream.set(fileName, stream);
    }

    return this.accessLogStream.get(fileName);
  }

  /**
   * Create a basic buffering stream.
   */
  public createBufferStream(
    stream: RFS.RotatingFileStream,
    interval: number = 1e3,
  ) {
    let buf = [];
    let timer = null;

    // return a minimal "stream"
    return {
      write(chunk: any) {
        if (timer === null) {
          timer = setTimeout(() => {
            timer = null;
            stream.write(buf.join(''));
            buf.length = 0;
          }, interval);
        }

        buf.push(chunk);
      },
    };
  }

  public createNameGenerator(filename: string): RFS.Generator {
    return (date: Date, index: number) => {
      if (!date) {
        return filename + '.log';
      }
      if (!(date instanceof Date)) {
        date = new Date(date);
      }

      return (
        `${filename}-` +
        `${date.getFullYear()}-` +
        `${String(date.getMonth() + 1).padStart(2, '0')}-` +
        `${String(date.getDate()).padStart(2, '0')}-` +
        // `${String(date.getHours()).padStart(2, '0')}` +
        // `/` +
        `-` +
        // `${filename}-` +
        `${String(date.getHours()).padStart(2, '0')}-` +
        `${String(date.getMinutes()).padStart(2, '0')}-` +
        `${String(index).padStart(2, '0')}` +
        `.log`
      );
    };
  }

  public toLog(data: any, fileName = 'app') {
    const stream = this.getStream(fileName);
    stream.write(data);
  }
}

export const loggerFS = new LoggerFS();

export const sololog = ololog
  .configure({
    time: true,
    tag: true,
    'render+'(text, { consoleMethod = '' }) {
      // If not empty, then save to file
      if (text && consoleMethod) {
        // remove ANSI codes
        const strippedText = ansi.strip(text).trim() + '\n';
        loggerFS.toLog(strippedText, 'info');

        /*  Writes .error and .warn calls to a separate file   */
        if (consoleMethod === 'error' || consoleMethod === 'warn') {
          loggerFS.toLog(strippedText, 'error');
        }
      }

      return text;
    },
  })
  .methods({
    vkUserId(userId: number) {
      return (this as ololog).yellow.configure({
        'concat+': (lines: string[]) => {
          lines = bullet(
            ansi.lightMagenta(`[@${String(userId).padEnd(9, ' ')}] `),
            lines,
          );
          return lines;
        },
      });
    },
  });

export const createNestLogger = (context: string) => {
  // TODO: improve it

  const contextLimit = 0; /* 16 */
  const logger = sololog.yellow.configure({
    locate: false /* customLocator */,
    'time+': (lines: string[]) => {
      const appName = 'Nest';
      const pidMessage = /* levelColor[level] */ (
        ansi.green || ((e: string) => e)
      )(`[${appName}] ${String(process.pid).padEnd(6)} - `);
      lines = bullet(pidMessage, lines);
      return lines;
    },
    'concat+': (lines: string[]) => {
      if (context) {
        if (contextLimit > 0) {
          context = stringify.limit(context, contextLimit).padEnd(contextLimit);
        }
        lines = bullet(ansi.yellow(`[${context}] `), lines);
      }
      return lines;
    },
  });

  // return {
  //   info: logger.info.bind(logger),
  //   warn: logger.warn.bind(logger),
  //   debug: logger.debug.bind(logger),
  //   error: logger.error.bind(logger),
  // } as LoggerType;

  return logger as LoggerType;
};

export const setErrorListener = () => {
  process.on('uncaughtException', (err) => {
    sololog.error.bright.red.noLocate(err);
  });
  process.on('unhandledRejection', (err) => {
    sololog.bright.red.error.noLocate(err);
  });
};
