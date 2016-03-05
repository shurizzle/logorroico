import glob from 'glob';

function* iter(matches) {
  for (let x in matches) {
    yield matches[x];
  }
}

function globAsync(dir) {
  return new Promise((resolve, reject) =>
    glob('*/**/*.json', { matchBase: true, cwd: dir }, (err, matches) => {
      if (err) { reject(err); }
      else     { resolve(iter(matches)); }
    })
  );
}

function globSync(dir) {
  const matches = glob.sync('*/**/*.json', { matchBase: true, cwd: dir });
  return iter(matches);
}

globAsync.sync = globSync;

export default globAsync;
export const sync = globSync;
