import * as perf from 'perf-deets';

let LOCK_TYPES = {
  NONE: 0,
  SHARED: 1,
  RESERVED: 2,
  PENDING: 3,
  EXCLUSIVE: 4
};

function getPageSize(bufferView) {
  // See 1.3.2 on https://www.sqlite.org/fileformat.html The page size
  // is stored as a 2 byte integer at the 16th byte. It's stored as
  // big-endian so the first byte is the larger one. Combine it into a
  // single integer.
  let int1 = bufferView[16];
  let int2 = bufferView[17];
  return (int1 << 8) + int2;
}

function isSafeToWrite(localData, diskData) {
  if (localData != null && diskData != null) {
    let localView = new Uint8Array(localData);
    let diskView = new Uint8Array(diskData);

    // See
    // https://github.com/sqlite/sqlite/blob/master/src/pager.c#L93-L96
    // (might be documented somewhere? I didn't see it this clearly in
    // the docs). At least one of these bytes change when sqlite3 writes
    // data. We can check this against our in-memory data to see if it's
    // safe to write (if something changes underneath us, it's not)
    for (let i = 24; i < 40; i++) {
      if (localView[i] !== diskView[i]) {
        return false;
      }
    }
    return true;
  }

  // One of them is null, so it's only safe if to write if both are
  // null, otherwise they are different
  return localData == null && diskData == null;
}

function range(start, end, step) {
  let r = [];
  for (let i = start; i <= end; i += step) {
    r.push(i);
  }
  return r;
}

function getBoundaryIndexes(blockSize, start, end) {
  let startC = start - (start % blockSize);
  let endC = end - 1 - ((end - 1) % blockSize);

  return range(startC, endC, blockSize);
}

function readChunks(chunks, start, end) {
  let buffer = new ArrayBuffer(end - start);
  let bufferView = new Uint8Array(buffer);
  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i];

    // TODO: jest has a bug where we can't do `instanceof ArrayBuffer`
    if (chunk.data.constructor.name !== 'ArrayBuffer') {
      throw new Error('Chunk data is not an ArrayBuffer');
    }

    let cstart = 0;
    let cend = chunk.data.byteLength;

    if (start > chunk.pos) {
      cstart = start - chunk.pos;
    }
    if (end < chunk.pos + chunk.data.byteLength) {
      cend = end - chunk.pos;
    }

    if (cstart > chunk.data.byteLength || cend < 0) {
      continue;
    }

    let len = cend - cstart;

    bufferView.set(
      new Uint8Array(chunk.data, cstart, len),
      chunk.pos - start + cstart
    );
  }

  return buffer;
}

function writeChunks(bufferView, blockSize, start, end) {
  let indexes = getBoundaryIndexes(blockSize, start, end);
  let cursor = 0;

  return indexes
    .map(index => {
      let cstart = 0;
      let cend = blockSize;
      if (start > index && start < index + blockSize) {
        cstart = start - index;
      }
      if (end > index && end < index + blockSize) {
        cend = end - index;
      }

      let len = cend - cstart;
      let chunkBuffer = new ArrayBuffer(blockSize);

      if (start > index + blockSize || end <= index) {
        return null;
      }

      let off = bufferView.byteOffset + cursor;

      let available = bufferView.buffer.byteLength - off;
      if (available <= 0) {
        return null;
      }

      let readLength = Math.min(len, available);

      new Uint8Array(chunkBuffer).set(
        new Uint8Array(bufferView.buffer, off, readLength),
        cstart
      );
      cursor += readLength;

      return {
        pos: index,
        data: chunkBuffer,
        offset: cstart,
        length: readLength
      };
    })
    .filter(Boolean);
}

class File {
  constructor(filename, ops, meta = null) {
    this.filename = filename;
    this.buffer = new Map();
    this.ops = ops;
    this.meta = meta;
    this._metaDirty = false;
    this.writeLock = false;
    this.openHandles = 0;
  }

  bufferChunks(chunks) {
    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];
      this.buffer.set(chunk.pos, chunk);
    }
  }

  open() {
    this.openHandles++;

    // Don't open the file again if it's already open
    if (this.openHandles === 1) {
      this.ops.open();
      let meta = this.ops.readMeta();

      // It's possible that `setattr` has already been called if opening
      // the file in a mode that truncates it to 0
      if (this.meta == null) {
        if (meta == null) {
          // New file

          meta = { size: 0 };
        }

        this.meta = meta;
      }
    }

    return this.meta;
  }

  close() {
    this.fsync();

    this.openHandles = Math.max(this.openHandles - 1, 0);

    // Only close it if there are no existing open handles
    if (this.openHandles === 0) {
      this.ops.close();
    }
  }

  delete() {
    this.ops.delete();
  }

  load(indexes) {
    let status = indexes.reduce(
      (acc, b) => {
        let inMemory = this.buffer.get(b);
        if (inMemory) {
          acc.chunks.push(inMemory);
        } else {
          acc.missing.push(b);
        }
        return acc;
      },
      { chunks: [], missing: [] }
    );

    let missingChunks = [];
    if (status.missing.length > 0) {
      perf.record('read-blocks');
      missingChunks = this.ops.readBlocks(status.missing, this.meta.blockSize);
      perf.endRecording('read-blocks');
    }
    return status.chunks.concat(missingChunks);
  }

  read(bufferView, offset, length, position) {
    // console.log('reading', this.filename, offset, length, position);
    let buffer = bufferView.buffer;

    if (length <= 0) {
      return 0;
    }
    if (position < 0) {
      // TODO: is this right?
      return 0;
    }
    if (position >= this.meta.size) {
      let view = new Uint8Array(buffer, offset);
      for (let i = 0; i < length; i++) {
        view[i] = 0;
      }

      return length;
    }

    position = Math.max(position, 0);
    let dataLength = Math.min(length, this.meta.size - position);

    let start = position;
    let end = position + dataLength;

    let indexes = getBoundaryIndexes(this.meta.blockSize, start, end);

    let chunks = this.load(indexes);
    let readBuffer = readChunks(chunks, start, end);

    if (buffer.byteLength - offset < readBuffer.byteLength) {
      throw new Error('Buffer given to `read` is too small');
    }
    let view = new Uint8Array(buffer);
    view.set(new Uint8Array(readBuffer), offset);

    // TODO: I don't need to do this. `unixRead` does this for us.
    for (let i = dataLength; i < length; i++) {
      view[offset + i] = 0;
    }

    return length;
  }

  write(bufferView, offset, length, position) {
    // console.log('writing', this.filename, offset, length, position);

    if (this.meta.blockSize == null) {
      // We don't have a block size yet (an empty file). The first
      // write MUST be the beginning of the file. This is a new file
      // and the first block contains the page size which we need.
      // sqlite will write this block first, and if you are directly
      // writing a db file to disk you can't write random parts of it.
      // Just write the whole thing and we'll get the first block
      // first.

      let pageSize = getPageSize(
        new Uint8Array(bufferView.buffer, bufferView.byteOffset + offset)
      );

      // Page sizes must be a power of 2 between 512 and 65536.
      // These was generated by doing `Math.pow(2, N)` where N >= 9
      // and N <= 16.
      if (
        ![512, 1024, 2048, 4096, 8192, 16384, 32768, 65536].includes(pageSize)
      ) {
        throw new Error(
          'File has invalid page size. (the first block of a new file must be written first)'
        );
      }

      this.setattr({ blockSize: pageSize });
    }

    let buffer = bufferView.buffer;

    if (length <= 0) {
      return 0;
    }
    if (position < 0) {
      return 0;
    }
    if (buffer.byteLength === 0) {
      return 0;
    }

    perf.count('writes');

    length = Math.min(length, buffer.byteLength - offset);

    let writes = writeChunks(
      new Uint8Array(buffer, offset, length),
      this.meta.blockSize,
      position,
      position + length
    );

    // Find any partial chunks and read them in and merge with
    // existing data
    let { partialWrites, fullWrites } = writes.reduce(
      (state, write) => {
        if (write.length !== this.meta.blockSize) {
          state.partialWrites.push(write);
        } else {
          state.fullWrites.push({
            pos: write.pos,
            data: write.data
          });
        }
        return state;
      },
      { fullWrites: [], partialWrites: [] }
    );

    let reads = [];
    if (partialWrites.length > 0) {
      reads = this.load(partialWrites.map(w => w.pos));
    }

    let allWrites = fullWrites.concat(
      reads.map(read => {
        let write = partialWrites.find(w => w.pos === read.pos);

        // MuTatIoN!
        new Uint8Array(read.data).set(
          new Uint8Array(write.data, write.offset, write.length),
          write.offset,
          write.length
        );

        return read;
      })
    );

    this.bufferChunks(allWrites);

    if (position + length > this.meta.size) {
      this.setattr({ size: position + length });
    }

    return length;
  }

  async readIfFallback() {
    if (this.ops.readIfFallback) {
      // Reset the meta
      let meta = await this.ops.readIfFallback();
      this.meta = meta || { size: 0 };
    }
  }

  lock(lockType) {
    // TODO: Perf APIs need improvement
    if (!this._recordingLock) {
      perf.record('locked');
      this._recordingLock = true;
    }

    if (this.ops.lock(lockType)) {
      if (lockType >= LOCK_TYPES.RESERVED) {
        this.writeLock = true;
      }
      return true;
    }
    return false;
  }

  unlock(lockType) {
    if (lockType === 0) {
      perf.endRecording('locked');
      this._recordingLock = false;
    }

    if (this.writeLock) {
      // In certain cases (I saw this while running VACUUM after
      // changing page size) sqlite changes the size of the file
      // _after_ `fsync` for some reason. In our case, this is
      // critical because we are relying on fsync to write everything
      // out. If we just did some writes, do another fsync which will
      // check the meta and make sure it's persisted if dirty (all
      // other writes should already be flushed by now)
      this.fsync();
      this.writeLock = false;
    }

    return this.ops.unlock(lockType);
  }

  fsync() {
    if (this.buffer.size > 0) {
      // We need to handle page size changes which restructures the
      // whole db. We check if the page size is being written and
      // handle it
      let first = this.buffer.get(0);
      if (first) {
        let pageSize = getPageSize(new Uint8Array(first.data));

        if (pageSize !== this.meta.blockSize) {
          // The page size changed! We need to reflect that in our
          // storage. We need to restructure all pending writes and
          // change our page size so all future writes reflect the new
          // size.
          let buffer = this.buffer;
          this.buffer = new Map();

          // We take all pending writes, concat them into a single
          // buffer, and rewrite it out with the new size. This would
          // be dangerous if the page size could be changed at any
          // point in time since we don't handle partial reads here.
          // However sqlite only ever actually changes the page size
          // in 2 cases:
          //
          // * The db is empty (no data yet, so nothing to read)
          // * A VACUUM command is rewriting the entire db
          //
          // In both cases, we can assume we have _all_ the needed
          // data in the pending buffer, and we don't have to worry
          // about overwriting anything.

          let writes = [...buffer.values()];
          let totalSize = writes.length * this.meta.blockSize;
          let buf = new ArrayBuffer(totalSize);
          let view = new Uint8Array(buf);

          for (let write of writes) {
            view.set(new Uint8Array(write.data), write.pos);
          }

          // Rewrite the buffer with the new page size
          this.bufferChunks(writeChunks(view, pageSize, 0, totalSize));

          // Change our page size
          this.setattr({ blockSize: pageSize });
        }
      }

      this.ops.writeBlocks([...this.buffer.values()], this.meta.blockSize);
    }

    if (this._metaDirty) {
      // We only store the size right now. Block size is already
      // stored in the sqlite file and we don't need the rest
      //
      // TODO: Currently we don't delete any extra blocks after the
      // end of the file. This isn't super important, and in fact
      // could cause perf regressions (sqlite doesn't compress files
      // either!) but what we probably should do is detect a VACUUM
      // command (the whole db is being rewritten) and at that point
      // delete anything after the end of the file
      this.ops.writeMeta({ size: this.meta.size });
      this._metaDirty = false;
    }

    this.buffer = new Map();
  }

  setattr(attr) {
    if (this.meta == null) {
      this.meta = {};
    }

    // Size is the only attribute we actually persist. The rest are
    // stored in memory

    if (attr.mode !== undefined) {
      this.meta.mode = attr.mode;
    }

    if (attr.blockSize !== undefined) {
      this.meta.blockSize = attr.blockSize;
    }

    if (attr.size !== undefined) {
      this.meta.size = attr.size;
      this._metaDirty = true;
    }
  }

  getattr() {
    return this.meta;
  }
}

let FINALIZED = 0xdeadbeef;

let WRITEABLE = 0;
let READABLE = 1;

class Reader {
  constructor(
    buffer,
    { initialOffset = 4, useAtomics = true, stream = true, debug, name } = {}
  ) {
    this.buffer = buffer;
    this.atomicView = new Int32Array(buffer);
    this.offset = initialOffset;
    this.useAtomics = useAtomics;
    this.stream = stream;
    this.debug = debug;
    this.name = name;
  }

  log(...args) {
    if (this.debug) {
      console.log(`[reader: ${this.name}]`, ...args);
    }
  }

  waitWrite(name, timeout = null) {
    if (this.useAtomics) {
      this.log(`waiting for ${name}`);

      while (Atomics.load(this.atomicView, 0) === WRITEABLE) {
        if (timeout != null) {
          if (
            Atomics.wait(this.atomicView, 0, WRITEABLE, timeout) === 'timed-out'
          ) {
            throw new Error('timeout');
          }
        }

        Atomics.wait(this.atomicView, 0, WRITEABLE, 500);
      }

      this.log(`resumed for ${name}`);
    } else {
      if (this.atomicView[0] !== READABLE) {
        throw new Error('`waitWrite` expected array to be readable');
      }
    }
  }

  flip() {
    this.log('flip');
    if (this.useAtomics) {
      let prev = Atomics.compareExchange(
        this.atomicView,
        0,
        READABLE,
        WRITEABLE
      );

      if (prev !== READABLE) {
        throw new Error('Read data out of sync! This is disastrous');
      }

      Atomics.notify(this.atomicView, 0);
    } else {
      this.atomicView[0] = WRITEABLE;
    }

    this.offset = 4;
  }

  done() {
    this.waitWrite('done');

    let dataView = new DataView(this.buffer, this.offset);
    let done = dataView.getUint32(0) === FINALIZED;

    if (done) {
      this.log('done');
      this.flip();
    }

    return done;
  }

  peek(fn) {
    this.peekOffset = this.offset;
    let res = fn();
    this.offset = this.peekOffset;
    this.peekOffset = null;
    return res;
  }

  string(timeout) {
    this.waitWrite('string', timeout);

    let byteLength = this._int32();
    let length = byteLength / 2;

    let dataView = new DataView(this.buffer, this.offset, byteLength);
    let chars = [];
    for (let i = 0; i < length; i++) {
      chars.push(dataView.getUint16(i * 2));
    }
    let str = String.fromCharCode.apply(null, chars);
    this.log('string', str);

    this.offset += byteLength;

    if (this.peekOffset == null) {
      this.flip();
    }
    return str;
  }

  _int32() {
    let byteLength = 4;

    let dataView = new DataView(this.buffer, this.offset);
    let num = dataView.getInt32();
    this.log('_int32', num);

    this.offset += byteLength;
    return num;
  }

  int32() {
    this.waitWrite('int32');
    let num = this._int32();
    this.log('int32', num);

    if (this.peekOffset == null) {
      this.flip();
    }
    return num;
  }

  bytes() {
    this.waitWrite('bytes');

    let byteLength = this._int32();

    let bytes = new ArrayBuffer(byteLength);
    new Uint8Array(bytes).set(
      new Uint8Array(this.buffer, this.offset, byteLength)
    );
    this.log('bytes', bytes);

    this.offset += byteLength;

    if (this.peekOffset == null) {
      this.flip();
    }
    return bytes;
  }
}

class Writer {
  constructor(
    buffer,
    { initialOffset = 4, useAtomics = true, stream = true, debug, name } = {}
  ) {
    this.buffer = buffer;
    this.atomicView = new Int32Array(buffer);
    this.offset = initialOffset;
    this.useAtomics = useAtomics;
    this.stream = stream;

    this.debug = debug;
    this.name = name;

    if (this.useAtomics) {
      // The buffer starts out as writeable
      Atomics.store(this.atomicView, 0, WRITEABLE);
    } else {
      this.atomicView[0] = WRITEABLE;
    }
  }

  log(...args) {
    if (this.debug) {
      console.log(`[writer: ${this.name}]`, ...args);
    }
  }

  waitRead(name) {
    if (this.useAtomics) {
      this.log(`waiting for ${name}`);
      // Switch to writable
      // Atomics.store(this.atomicView, 0, 1);

      let prev = Atomics.compareExchange(
        this.atomicView,
        0,
        WRITEABLE,
        READABLE
      );

      if (prev !== WRITEABLE) {
        throw new Error(
          'Wrote something into unwritable buffer! This is disastrous'
        );
      }

      Atomics.notify(this.atomicView, 0);

      while (Atomics.load(this.atomicView, 0) === READABLE) {
        // console.log('waiting to be read...');
        Atomics.wait(this.atomicView, 0, READABLE, 500);
      }

      this.log(`resumed for ${name}`);
    } else {
      this.atomicView[0] = READABLE;
    }

    this.offset = 4;
  }

  finalize() {
    this.log('finalizing');
    let dataView = new DataView(this.buffer, this.offset);
    dataView.setUint32(0, FINALIZED);
    this.waitRead('finalize');
  }

  string(str) {
    this.log('string', str);

    let byteLength = str.length * 2;
    this._int32(byteLength);

    let dataView = new DataView(this.buffer, this.offset, byteLength);
    for (let i = 0; i < str.length; i++) {
      dataView.setUint16(i * 2, str.charCodeAt(i));
    }

    this.offset += byteLength;
    this.waitRead('string');
  }

  _int32(num) {
    let byteLength = 4;

    let dataView = new DataView(this.buffer, this.offset);
    dataView.setInt32(0, num);

    this.offset += byteLength;
  }

  int32(num) {
    this.log('int32', num);
    this._int32(num);
    this.waitRead('int32');
  }

  bytes(buffer) {
    this.log('bytes', buffer);

    let byteLength = buffer.byteLength;
    this._int32(byteLength);
    new Uint8Array(this.buffer, this.offset).set(new Uint8Array(buffer));

    this.offset += byteLength;
    this.waitRead('bytes');
  }
}

function positionToKey$1(pos, blockSize) {
  // We are forced to round because of floating point error. `pos`
  // should always be divisible by `blockSize`
  return Math.round(pos / blockSize);
}

function startWorker(reader, writer) {
  // In a normal world, we'd spawn the worker here as a child worker.
  // However Safari doesn't support nested workers, so we have to
  // proxy them through the main thread
  self.postMessage({
    type: '__absurd:spawn-idb-worker',
    argBuffer: writer.buffer,
    resultBuffer: reader.buffer
  });

  self.addEventListener('message', e => {
    switch (e.data.type) {
      // Normally you would use `postMessage` control the profiler in
      // a worker (just like this worker go those events), and the
      // perf library automatically handles those events. We don't do
      // that for the special backend worker though because it's
      // always blocked when it's not processing. Instead we forward
      // these events by going through the atomics layer to unblock it
      // to make sure it starts immediately
      case '__perf-deets:start-profile':
        writer.string('profile-start');
        writer.finalize();
        reader.int32();
        reader.done();
        break;

      case '__perf-deets:stop-profile':
        writer.string('profile-stop');
        writer.finalize();
        reader.int32();
        reader.done();
        break;
    }
  });
}

class FileOps {
  constructor(filename) {
    this.filename = filename;
  }

  // TODO: This should be renamed to `getDatabaseName`
  getStoreName() {
    return this.filename.replace(/\//g, '-');
  }

  invokeWorker(method, args) {
    if (this.reader == null || this.writer == null) {
      throw new Error(
        `Attempted ${method} on ${this.filename} but file not open`
      );
    }

    let reader = this.reader;
    let writer = this.writer;

    switch (method) {
      case 'readBlocks': {
        let { name, positions, blockSize } = args;

        let res = [];
        for (let pos of positions) {
          writer.string('readBlock');
          writer.string(name);
          writer.int32(positionToKey$1(pos, blockSize));
          writer.finalize();

          let data = reader.bytes();
          reader.done();
          res.push({
            pos,
            // If th length is 0, the block didn't exist. We return a
            // blank block in that case
            data: data.byteLength === 0 ? new ArrayBuffer(blockSize) : data
          });
        }

        return res;
      }

      case 'writeBlocks': {
        let { name, writes, blockSize } = args;
        writer.string('writeBlocks');
        writer.string(name);
        for (let write of writes) {
          writer.int32(positionToKey$1(write.pos, blockSize));
          writer.bytes(write.data);
        }
        writer.finalize();

        let res = reader.int32();
        reader.done();
        return res;
      }

      case 'readMeta': {
        writer.string('readMeta');
        writer.string(args.name);
        writer.finalize();

        let size = reader.int32();
        let blockSize = reader.int32();
        reader.done();
        return size === -1 ? null : { size, blockSize };
      }

      case 'writeMeta': {
        let { name, meta } = args;
        writer.string('writeMeta');
        writer.string(name);
        writer.int32(meta.size);
        // writer.int32(meta.blockSize);
        writer.finalize();

        let res = reader.int32();
        reader.done();
        return res;
      }

      case 'closeFile': {
        writer.string('closeFile');
        writer.string(args.name);
        writer.finalize();

        let res = reader.int32();
        reader.done();
        return res;
      }

      case 'lockFile': {
        writer.string('lockFile');
        writer.string(args.name);
        writer.int32(args.lockType);
        writer.finalize();

        let res = reader.int32();
        reader.done();
        return res === 0;
      }

      case 'unlockFile': {
        writer.string('unlockFile');
        writer.string(args.name);
        writer.int32(args.lockType);
        writer.finalize();

        let res = reader.int32();
        reader.done();
        return res === 0;
      }
    }
  }

  lock(lockType) {
    return this.invokeWorker('lockFile', {
      name: this.getStoreName(),
      lockType
    });
  }

  unlock(lockType) {
    return this.invokeWorker('unlockFile', {
      name: this.getStoreName(),
      lockType
    });
  }

  delete() {
    // Close the file if it's open
    if (this.reader || this.writer) {
      this.close();
    }

    // We delete it here because we can't do it in the worker; the
    // worker is stopped when the file closes. If we didn't do that,
    // workers would leak in the case of closing a file but not
    // deleting it. We could potentially restart the worker here if
    // needed, but for now just assume that the deletion is a success
    let req = globalThis.indexedDB.deleteDatabase(this.getStoreName());
    req.onerror = () => {
      console.warn(`Deleting ${this.filename} database failed`);
    };
    req.onsuccess = () => {};
  }

  open() {
    let argBuffer = new SharedArrayBuffer(4096 * 9);
    this.writer = new Writer(argBuffer, {
      name: 'args (backend)',
      debug: false
    });

    let resultBuffer = new SharedArrayBuffer(4096 * 9);
    this.reader = new Reader(resultBuffer, {
      name: 'results',
      debug: false
    });

    // TODO: We could pool workers and reuse them so opening files
    // aren't so slow
    startWorker(this.reader, this.writer);
  }

  close() {
    this.invokeWorker('closeFile', { name: this.getStoreName() });
    this.reader = null;
    this.writer = null;
    this.worker = null;
  }

  readMeta() {
    return this.invokeWorker('readMeta', { name: this.getStoreName() });
  }

  writeMeta(meta) {
    return this.invokeWorker('writeMeta', { name: this.getStoreName(), meta });
  }

  readBlocks(positions, blockSize) {
    if (this.stats) {
      this.stats.read += positions.length;
    }

    return this.invokeWorker('readBlocks', {
      name: this.getStoreName(),
      positions,
      blockSize
    });
  }

  writeBlocks(writes, blockSize) {
    if (this.stats) {
      this.stats.writes += writes.length;
    }

    return this.invokeWorker('writeBlocks', {
      name: this.getStoreName(),
      writes,
      blockSize
    });
  }
}

/**
 * https://bugs.webkit.org/show_bug.cgi?id=226547
 * Safari has a horrible bug where IDB requests can hang while the browser is starting up.
 * The only solution is to keep nudging it until it's awake.
 * This probably creates garbage, but garbage is better than totally failing.
 */
function idbReady() {
    const isSafari = !navigator.userAgentData &&
        /Safari\//.test(navigator.userAgent) &&
        !/Chrom(e|ium)\//.test(navigator.userAgent);
    // No point putting other browsers or older versions of Safari through this mess.
    if (!isSafari || !indexedDB.databases)
        return Promise.resolve();
    let intervalId;
    return new Promise((resolve) => {
        const tryIdb = () => indexedDB.databases().finally(resolve);
        intervalId = setInterval(tryIdb, 100);
        tryIdb();
    }).finally(() => clearInterval(intervalId));
}

function positionToKey(pos, blockSize) {
  // We are forced to round because of floating point error. `pos`
  // should always be divisible by `blockSize`
  return Math.round(pos / blockSize);
}

async function openDb(name) {
  await idbReady();

  return new Promise((resolve, reject) => {
    let req = globalThis.indexedDB.open(name, 2);
    req.onsuccess = event => {
      let db = event.target.result;

      db.onversionchange = () => {
        console.log('closing because version changed');
        db.close();
      };
      db.onclose = () => {};

      resolve(db);
    };
    req.onupgradeneeded = event => {
      let db = event.target.result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data');
      }
    };
    req.onblocked = e => console.log('blocked', e);
    req.onerror = req.onabort = e => reject(e.target.error);
  });
}

// Using a separate class makes it easier to follow the code, and
// importantly it removes any reliance on internal state in
// `FileOpsFallback`. That would be problematic since these method
// happen async; the args to `write` must be closed over so they don't
// change
class Persistance {
  constructor(dbName, onFallbackFailure) {
    this.dbName = dbName;
    this._openDb = null;
    this.hasAlertedFailure = false;
    this.onFallbackFailure = onFallbackFailure;
  }

  async getDb() {
    if (this._openDb) {
      return this._openDb;
    }

    this._openDb = await openDb(this.dbName);
    return this._openDb;
  }

  closeDb() {
    if (this._openDb) {
      this._openDb.close();
      this._openDb = null;
    }
  }

  // Both `readAll` and `write` rely on IndexedDB transactional
  // semantics to work, otherwise we'd have to coordinate them. If
  // there are pending writes, the `readonly` transaction in `readAll`
  // will block until they are all flushed out. If `write` is called
  // multiple times, `readwrite` transactions can only run one at a
  // time so it will naturally apply the writes sequentially (and
  // atomically)

  async readAll() {
    let db = await this.getDb(this.dbName);
    let blocks = new Map();

    let trans = db.transaction(['data'], 'readonly');
    let store = trans.objectStore('data');

    return new Promise((resolve, reject) => {
      // Open a cursor and iterate through the entire file
      let req = store.openCursor(IDBKeyRange.lowerBound(-1));
      req.onerror = reject;
      req.onsuccess = e => {
        let cursor = e.target.result;
        if (cursor) {
          blocks.set(cursor.key, cursor.value);
          cursor.continue();
        } else {
          resolve(blocks);
        }
      };
    });
  }

  async write(writes, cachedFirstBlock, hasLocked) {
    let db = await this.getDb(this.dbName);

    // We need grab a readwrite lock on the db, and then read to check
    // to make sure we can write to it
    let trans = db.transaction(['data'], 'readwrite');
    let store = trans.objectStore('data');

    await new Promise((resolve, reject) => {
      let req = store.get(0);
      req.onsuccess = e => {
        if (hasLocked) {
          if (!isSafeToWrite(req.result, cachedFirstBlock)) {
            if (this.onFallbackFailure && !this.hasAlertedFailure) {
              this.hasAlertedFailure = true;
              this.onFallbackFailure();
            }
            reject(new Error('Fallback mode unable to write file changes'));
            return;
          }
        }

        // Flush all the writes
        for (let write of writes) {
          store.put(write.value, write.key);
        }

        trans.onsuccess = () => resolve();
        trans.onerror = () => reject();
      };
      req.onerror = reject;
    });
  }
}

class FileOpsFallback {
  constructor(filename, onFallbackFailure) {
    this.filename = filename;
    this.dbName = this.filename.replace(/\//g, '-');
    this.cachedFirstBlock = null;
    this.writeQueue = null;
    this.blocks = new Map();
    this.lockType = 0;
    this.transferBlockOwnership = false;

    this.persistance = new Persistance(this.dbName, onFallbackFailure);
  }

  async readIfFallback() {
    this.transferBlockOwnership = true;
    this.blocks = await this.persistance.readAll();

    return this.readMeta();
  }

  lock(lockType) {
    // Locks always succeed here. Essentially we're only working
    // locally (we can't see any writes from anybody else) and we just
    // want to track the lock so we know when it downgrades from write
    // to read
    this.cachedFirstBlock = this.blocks.get(0);
    this.lockType = lockType;
    return true;
  }

  unlock(lockType) {
    if (this.lockType > LOCK_TYPES.SHARED && lockType === LOCK_TYPES.SHARED) {
      // Within a write lock, we delay all writes until the end of the
      // lock. We probably don't have to do this since we already
      // delay writes until an `fsync`, however this is an extra
      // measure to make sure we are writing everything atomically
      this.flush();
    }
    this.lockType = lockType;
    return true;
  }

  delete() {
    let req = globalThis.indexedDB.deleteDatabase(this.dbName);
    req.onerror = () => {
      console.warn(`Deleting ${this.filename} database failed`);
    };
    req.onsuccess = () => {};
  }

  open() {
    this.writeQueue = [];
    this.lockType = 0;
  }

  close() {
    this.flush();

    if (this.transferBlockOwnership) {
      this.transferBlockOwnership = false;
    } else {
      this.blocks = new Map();
    }

    this.persistance.closeDb();
  }

  readMeta() {
    let metaBlock = this.blocks.get(-1);
    if (metaBlock) {
      let block = this.blocks.get(0);

      return {
        size: metaBlock.size,
        blockSize: getPageSize(new Uint8Array(block))
      };
    }
    return null;
  }

  writeMeta(meta) {
    this.blocks.set(-1, meta);
    this.queueWrite(-1, meta);
  }

  readBlocks(positions, blockSize) {
    let res = [];
    for (let pos of positions) {
      res.push({
        pos,
        data: this.blocks.get(positionToKey(pos, blockSize))
      });
    }
    return res;
  }

  writeBlocks(writes, blockSize) {
    for (let write of writes) {
      let key = positionToKey(write.pos, blockSize);
      this.blocks.set(key, write.data);
      this.queueWrite(key, write.data);
    }

    // No write lock; flush them out immediately
    if (this.lockType <= LOCK_TYPES.SHARED) {
      this.flush();
    }
  }

  queueWrite(key, value) {
    this.writeQueue.push({ key, value });
  }

  flush() {
    if (this.writeQueue.length > 0) {
      this.persistance.write(
        this.writeQueue,
        this.cachedFirstBlock,
        this.lockType > LOCK_TYPES.SHARED
      );
      this.writeQueue = [];
    }
    this.cachedFirstBlock = null;
  }
}

class IndexedDBBackend {
  constructor(onFallbackFailure) {
    this.onFallbackFailure = onFallbackFailure;
  }

  createFile(filename) {
    let ops;
    if (typeof SharedArrayBuffer !== 'undefined') {
      // SharedArrayBuffer exists! We can run this fully
      ops = new FileOps(filename);
    } else {
      // SharedArrayBuffer is not supported. Use the fallback methods
      // which provide a somewhat working version, but doesn't
      // support mutations across connections (tabs)
      ops = new FileOpsFallback(filename, this.onFallbackFailure);
    }

    let file = new File(filename, ops);

    // If we don't need perf data, there's no reason for us to hold a
    // reference to the files. If we did we'd have to worry about
    // memory leaks
    if (process.env.NODE_ENV !== 'production' || process.env.PERF_BUILD) {
      if (this._files == null) {
        this._files = new Set();
      }
      this._files.add(file);
    }

    return file;
  }

  // Instead of controlling the profiler from the main thread by
  // posting a message to this worker, you can control it inside the
  // worker manually with these methods
  startProfile() {
    perf.start();
    for (let file of this._files) {
      // If the writer doesn't exist, that means the file has been
      // deleted
      if (file.ops.writer) {
        let writer = file.ops.writer;
        let reader = file.ops.reader;
        writer.string('profile-start');
        writer.finalize();
        reader.int32();
        reader.done();
      }
    }
  }

  stopProfile() {
    perf.stop();
    for (let file of this._files) {
      if (file.ops.writer) {
        let writer = file.ops.writer;
        let reader = file.ops.reader;
        writer.string('profile-stop');
        writer.finalize();
        reader.int32();
        reader.done();
      }
    }
  }
}

export default IndexedDBBackend;
