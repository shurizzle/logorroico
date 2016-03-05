import glob from './glob';
import path from 'path';
import fs from 'fs';

function readJsonSync(file) {
  return JSON.parse(fs.readFileSync(file), 'utf8');
}

function readJson(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, txt) => {
      if (err) {
        reject(err);
      }
      else {
        try {
          resolve(JSON.parse(txt));
        }
        catch (rejection) {
          reject(rejection);
        }
      }
    });
  });
}

function readPlainObject(dir, memo, file, callback) {
  const fullPath = path.join(dir, file);
  return readJson(fullPath).then(json => {
    if (typeof json !== 'object') {
      throw new TypeError(`${fullPath} is not an associative array`);
    }
    else {
      const [lang, ...rest] = file.replace(/\.json$/, '').split(path.sep),
            key = rest.join('.');

      memo[lang] = memo[lang] || {};
      plainObject(key, json, memo[lang]);
      return memo;
    }
  }).then(
    res => callback(undefined, res),
    err => callback(err)
  );
}

function async_reduce(iter, memo, cb, final) {
  const next = iter.next();
  if (next.done) {
    return final(undefined, memo);
  }
  else {
    const callback = (err, newMemo) => {
      if (err) { final(err) }
      else     { async_reduce(iter, newMemo, cb, final) }
    };
    cb(memo, next.value, callback);
  }
}

function formatKey(prep, k) {
  return prep ? (prep + '.' + k) : k;
}

function plainObject(prep, obj, res) {
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const fKey = formatKey(prep, key);
    if (typeof value !== 'string') {
      throw new TypeError(`${fKey} is not a string`);
    }
    res[fKey] = value;
  });
}

function parseSync(dir) {
  const res = {};
  for (const f of glob.sync(dir)) {
    const [lang, ...rest] = f.replace(/\.json$/, '').split(path.sep),
          key = rest.join('.'),
          json = readJsonSync(path.join(dir, f));
    if (typeof json !== 'object') {
      throw new TypeError(`${path.join(dir, f)} is not an associative array`);
    }
    res[lang] = res[lang] || {};
    plainObject(key, json, res[lang]);
  }
  return res;
}

function parseAsync(dir) {
  return new Promise((resolve, reject) => {
    const res = {};
    glob(dir).then(
      files => {
        async_reduce(files, {}, readPlainObject.bind(this, dir), (err, result) => {
          if (err) { reject(err); }
          else     { resolve(result); }
        });
      },
      reject
    );
  });
}

parseAsync.sync = parseSync;

export default parseAsync;
export const sync = parseSync;
