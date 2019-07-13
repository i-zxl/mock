import * as Think from "thinkjs";
import * as chokidar from 'chokidar';
import { join } from 'path';
import EventEmiter from 'events';

const MockMaps = {};

export interface WatchOptions {
  root?: string;
  include?: any;
  exclude?: string;
}
interface Adapter {
  on: (event: string, handle: (path: string) => void) => Adapter;
  emit: (event: string, args?: any) => Adapter;
  close: () => void;
}

function watch(include: any, exclude: string, root: string): Adapter {
  const EVENTS = new EventEmiter();
  const watcher = chokidar.watch(include, {
    ignored: exclude
  });
  const adapter: Adapter = {
    on(event, handler) {
      EVENTS.addListener(event, handler);
      return this;
    },
    emit(event, args) {
      EVENTS.emit(event, args);
      return this;
    },
    close() {
      watcher.close();
      EVENTS.removeAllListeners();
    }
  };
  watcher
    .on('add', (path) => {
      const modulePath: string = join(root, path);
      adapter.emit('add', modulePath);
    })
    .on('change', (path) => {
      const modulePath = join(root, path);
      adapter.emit('change', modulePath);
    })
    .on('unlink', (path) => {
      const modulePath = join(root, path);
      adapter.emit('remove', modulePath);
    })
    .on('ready', () => {
      adapter.emit('ready');
    });
  return adapter;
}

function register(filePath: string) {
  if (!filePath) {
    return false;
  }
  if (require.cache[filePath]) {
    delete require.cache[filePath];
  }
  const mock: any = require(filePath);
  MockMaps[`${mock.method.toUpperCase()} ${mock.url}`] = mock.handle;
}

export default (watchOptions: WatchOptions, app: Think.Application) => {
  const { root = join(this.ROOT_PATH, 'mock'), include = [],  exclude = "" } = watchOptions;
  const watcher: Adapter = watch(root, include, exclude);
  watcher
  .on('add', register)
  .on('change', register)
  .on('ready', register);
  return (ctx: Think.Context, next: () => void) => {
    if (app.env === 'development' && ctx.config('isMock')) {
      const mockIndex = `${ctx.method.toUpperCase()} ${ctx.url}`;
      if (MockMaps[mockIndex]) {
        return MockMaps[mockIndex](ctx);
      } else {
        return next();
      }
    } else {
      return next();
    }
  };
};
