module.exports = (function(e, t) {
    'use strict';
    var r = {};
    function __webpack_require__(t) {
        if (r[t]) {
            return r[t].exports;
        }
        var i = (r[t] = { i: t, l: false, exports: {} });
        e[t].call(i.exports, i, i.exports, __webpack_require__);
        i.l = true;
        return i.exports;
    }
    __webpack_require__.ab = __dirname + '/';
    function startup() {
        return __webpack_require__(131);
    }
    return startup();
})({
    1: function(e, t, r) {
        'use strict';
        var i =
            (this && this.__awaiter) ||
            function(e, t, r, i) {
                function adopt(e) {
                    return e instanceof r
                        ? e
                        : new r(function(t) {
                              t(e);
                          });
                }
                return new (r || (r = Promise))(function(r, n) {
                    function fulfilled(e) {
                        try {
                            step(i.next(e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function rejected(e) {
                        try {
                            step(i['throw'](e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function step(e) {
                        e.done ? r(e.value) : adopt(e.value).then(fulfilled, rejected);
                    }
                    step((i = i.apply(e, t || [])).next());
                });
            };
        Object.defineProperty(t, '__esModule', { value: true });
        const n = r(129);
        const o = r(622);
        const s = r(669);
        const a = r(672);
        const c = s.promisify(n.exec);
        function cp(e, t, r = {}) {
            return i(this, void 0, void 0, function*() {
                const { force: i, recursive: n } = readCopyOptions(r);
                const s = (yield a.exists(t)) ? yield a.stat(t) : null;
                if (s && s.isFile() && !i) {
                    return;
                }
                const c = s && s.isDirectory() ? o.join(t, o.basename(e)) : t;
                if (!(yield a.exists(e))) {
                    throw new Error(`no such file or directory: ${e}`);
                }
                const l = yield a.stat(e);
                if (l.isDirectory()) {
                    if (!n) {
                        throw new Error(
                            `Failed to copy. ${e} is a directory, but tried to copy without recursive flag.`
                        );
                    } else {
                        yield cpDirRecursive(e, c, 0, i);
                    }
                } else {
                    if (o.relative(e, c) === '') {
                        throw new Error(`'${c}' and '${e}' are the same file`);
                    }
                    yield copyFile(e, c, i);
                }
            });
        }
        t.cp = cp;
        function mv(e, t, r = {}) {
            return i(this, void 0, void 0, function*() {
                if (yield a.exists(t)) {
                    let i = true;
                    if (yield a.isDirectory(t)) {
                        t = o.join(t, o.basename(e));
                        i = yield a.exists(t);
                    }
                    if (i) {
                        if (r.force == null || r.force) {
                            yield rmRF(t);
                        } else {
                            throw new Error('Destination already exists');
                        }
                    }
                }
                yield mkdirP(o.dirname(t));
                yield a.rename(e, t);
            });
        }
        t.mv = mv;
        function rmRF(e) {
            return i(this, void 0, void 0, function*() {
                if (a.IS_WINDOWS) {
                    try {
                        if (yield a.isDirectory(e, true)) {
                            yield c(`rd /s /q "${e}"`);
                        } else {
                            yield c(`del /f /a "${e}"`);
                        }
                    } catch (e) {
                        if (e.code !== 'ENOENT') throw e;
                    }
                    try {
                        yield a.unlink(e);
                    } catch (e) {
                        if (e.code !== 'ENOENT') throw e;
                    }
                } else {
                    let t = false;
                    try {
                        t = yield a.isDirectory(e);
                    } catch (e) {
                        if (e.code !== 'ENOENT') throw e;
                        return;
                    }
                    if (t) {
                        yield c(`rm -rf "${e}"`);
                    } else {
                        yield a.unlink(e);
                    }
                }
            });
        }
        t.rmRF = rmRF;
        function mkdirP(e) {
            return i(this, void 0, void 0, function*() {
                yield a.mkdirP(e);
            });
        }
        t.mkdirP = mkdirP;
        function which(e, t) {
            return i(this, void 0, void 0, function*() {
                if (!e) {
                    throw new Error("parameter 'tool' is required");
                }
                if (t) {
                    const t = yield which(e, false);
                    if (!t) {
                        if (a.IS_WINDOWS) {
                            throw new Error(
                                `Unable to locate executable file: ${e}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also verify the file has a valid extension for an executable file.`
                            );
                        } else {
                            throw new Error(
                                `Unable to locate executable file: ${e}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.`
                            );
                        }
                    }
                }
                try {
                    const t = [];
                    if (a.IS_WINDOWS && process.env.PATHEXT) {
                        for (const e of process.env.PATHEXT.split(o.delimiter)) {
                            if (e) {
                                t.push(e);
                            }
                        }
                    }
                    if (a.isRooted(e)) {
                        const r = yield a.tryGetExecutablePath(e, t);
                        if (r) {
                            return r;
                        }
                        return '';
                    }
                    if (e.includes('/') || (a.IS_WINDOWS && e.includes('\\'))) {
                        return '';
                    }
                    const r = [];
                    if (process.env.PATH) {
                        for (const e of process.env.PATH.split(o.delimiter)) {
                            if (e) {
                                r.push(e);
                            }
                        }
                    }
                    for (const i of r) {
                        const r = yield a.tryGetExecutablePath(i + o.sep + e, t);
                        if (r) {
                            return r;
                        }
                    }
                    return '';
                } catch (e) {
                    throw new Error(`which failed with message ${e.message}`);
                }
            });
        }
        t.which = which;
        function readCopyOptions(e) {
            const t = e.force == null ? true : e.force;
            const r = Boolean(e.recursive);
            return { force: t, recursive: r };
        }
        function cpDirRecursive(e, t, r, n) {
            return i(this, void 0, void 0, function*() {
                if (r >= 255) return;
                r++;
                yield mkdirP(t);
                const i = yield a.readdir(e);
                for (const o of i) {
                    const i = `${e}/${o}`;
                    const s = `${t}/${o}`;
                    const c = yield a.lstat(i);
                    if (c.isDirectory()) {
                        yield cpDirRecursive(i, s, r, n);
                    } else {
                        yield copyFile(i, s, n);
                    }
                }
                yield a.chmod(t, (yield a.stat(e)).mode);
            });
        }
        function copyFile(e, t, r) {
            return i(this, void 0, void 0, function*() {
                if ((yield a.lstat(e)).isSymbolicLink()) {
                    try {
                        yield a.lstat(t);
                        yield a.unlink(t);
                    } catch (e) {
                        if (e.code === 'EPERM') {
                            yield a.chmod(t, '0666');
                            yield a.unlink(t);
                        }
                    }
                    const r = yield a.readlink(e);
                    yield a.symlink(r, t, a.IS_WINDOWS ? 'junction' : null);
                } else if (!(yield a.exists(t)) || r) {
                    yield a.copyFile(e, t);
                }
            });
        }
    },
    9: function(e, t, r) {
        'use strict';
        var i =
            (this && this.__awaiter) ||
            function(e, t, r, i) {
                function adopt(e) {
                    return e instanceof r
                        ? e
                        : new r(function(t) {
                              t(e);
                          });
                }
                return new (r || (r = Promise))(function(r, n) {
                    function fulfilled(e) {
                        try {
                            step(i.next(e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function rejected(e) {
                        try {
                            step(i['throw'](e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function step(e) {
                        e.done ? r(e.value) : adopt(e.value).then(fulfilled, rejected);
                    }
                    step((i = i.apply(e, t || [])).next());
                });
            };
        Object.defineProperty(t, '__esModule', { value: true });
        const n = r(87);
        const o = r(614);
        const s = r(129);
        const a = r(622);
        const c = r(1);
        const l = r(672);
        const u = process.platform === 'win32';
        class ToolRunner extends o.EventEmitter {
            constructor(e, t, r) {
                super();
                if (!e) {
                    throw new Error("Parameter 'toolPath' cannot be null or empty.");
                }
                this.toolPath = e;
                this.args = t || [];
                this.options = r || {};
            }
            _debug(e) {
                if (this.options.listeners && this.options.listeners.debug) {
                    this.options.listeners.debug(e);
                }
            }
            _getCommandString(e, t) {
                const r = this._getSpawnFileName();
                const i = this._getSpawnArgs(e);
                let n = t ? '' : '[command]';
                if (u) {
                    if (this._isCmdFile()) {
                        n += r;
                        for (const e of i) {
                            n += ` ${e}`;
                        }
                    } else if (e.windowsVerbatimArguments) {
                        n += `"${r}"`;
                        for (const e of i) {
                            n += ` ${e}`;
                        }
                    } else {
                        n += this._windowsQuoteCmdArg(r);
                        for (const e of i) {
                            n += ` ${this._windowsQuoteCmdArg(e)}`;
                        }
                    }
                } else {
                    n += r;
                    for (const e of i) {
                        n += ` ${e}`;
                    }
                }
                return n;
            }
            _processLineBuffer(e, t, r) {
                try {
                    let i = t + e.toString();
                    let o = i.indexOf(n.EOL);
                    while (o > -1) {
                        const e = i.substring(0, o);
                        r(e);
                        i = i.substring(o + n.EOL.length);
                        o = i.indexOf(n.EOL);
                    }
                    t = i;
                } catch (e) {
                    this._debug(`error processing line. Failed with error ${e}`);
                }
            }
            _getSpawnFileName() {
                if (u) {
                    if (this._isCmdFile()) {
                        return process.env['COMSPEC'] || 'cmd.exe';
                    }
                }
                return this.toolPath;
            }
            _getSpawnArgs(e) {
                if (u) {
                    if (this._isCmdFile()) {
                        let t = `/D /S /C "${this._windowsQuoteCmdArg(this.toolPath)}`;
                        for (const r of this.args) {
                            t += ' ';
                            t += e.windowsVerbatimArguments ? r : this._windowsQuoteCmdArg(r);
                        }
                        t += '"';
                        return [t];
                    }
                }
                return this.args;
            }
            _endsWith(e, t) {
                return e.endsWith(t);
            }
            _isCmdFile() {
                const e = this.toolPath.toUpperCase();
                return this._endsWith(e, '.CMD') || this._endsWith(e, '.BAT');
            }
            _windowsQuoteCmdArg(e) {
                if (!this._isCmdFile()) {
                    return this._uvQuoteCmdArg(e);
                }
                if (!e) {
                    return '""';
                }
                const t = [
                    ' ',
                    '\t',
                    '&',
                    '(',
                    ')',
                    '[',
                    ']',
                    '{',
                    '}',
                    '^',
                    '=',
                    ';',
                    '!',
                    "'",
                    '+',
                    ',',
                    '`',
                    '~',
                    '|',
                    '<',
                    '>',
                    '"',
                ];
                let r = false;
                for (const i of e) {
                    if (t.some(e => e === i)) {
                        r = true;
                        break;
                    }
                }
                if (!r) {
                    return e;
                }
                let i = '"';
                let n = true;
                for (let t = e.length; t > 0; t--) {
                    i += e[t - 1];
                    if (n && e[t - 1] === '\\') {
                        i += '\\';
                    } else if (e[t - 1] === '"') {
                        n = true;
                        i += '"';
                    } else {
                        n = false;
                    }
                }
                i += '"';
                return i
                    .split('')
                    .reverse()
                    .join('');
            }
            _uvQuoteCmdArg(e) {
                if (!e) {
                    return '""';
                }
                if (!e.includes(' ') && !e.includes('\t') && !e.includes('"')) {
                    return e;
                }
                if (!e.includes('"') && !e.includes('\\')) {
                    return `"${e}"`;
                }
                let t = '"';
                let r = true;
                for (let i = e.length; i > 0; i--) {
                    t += e[i - 1];
                    if (r && e[i - 1] === '\\') {
                        t += '\\';
                    } else if (e[i - 1] === '"') {
                        r = true;
                        t += '\\';
                    } else {
                        r = false;
                    }
                }
                t += '"';
                return t
                    .split('')
                    .reverse()
                    .join('');
            }
            _cloneExecOptions(e) {
                e = e || {};
                const t = {
                    cwd: e.cwd || process.cwd(),
                    env: e.env || process.env,
                    silent: e.silent || false,
                    windowsVerbatimArguments: e.windowsVerbatimArguments || false,
                    failOnStdErr: e.failOnStdErr || false,
                    ignoreReturnCode: e.ignoreReturnCode || false,
                    delay: e.delay || 1e4,
                };
                t.outStream = e.outStream || process.stdout;
                t.errStream = e.errStream || process.stderr;
                return t;
            }
            _getSpawnOptions(e, t) {
                e = e || {};
                const r = {};
                r.cwd = e.cwd;
                r.env = e.env;
                r['windowsVerbatimArguments'] = e.windowsVerbatimArguments || this._isCmdFile();
                if (e.windowsVerbatimArguments) {
                    r.argv0 = `"${t}"`;
                }
                return r;
            }
            exec() {
                return i(this, void 0, void 0, function*() {
                    if (
                        !l.isRooted(this.toolPath) &&
                        (this.toolPath.includes('/') || (u && this.toolPath.includes('\\')))
                    ) {
                        this.toolPath = a.resolve(process.cwd(), this.options.cwd || process.cwd(), this.toolPath);
                    }
                    this.toolPath = yield c.which(this.toolPath, true);
                    return new Promise((e, t) => {
                        this._debug(`exec tool: ${this.toolPath}`);
                        this._debug('arguments:');
                        for (const e of this.args) {
                            this._debug(`   ${e}`);
                        }
                        const r = this._cloneExecOptions(this.options);
                        if (!r.silent && r.outStream) {
                            r.outStream.write(this._getCommandString(r) + n.EOL);
                        }
                        const i = new ExecState(r, this.toolPath);
                        i.on('debug', e => {
                            this._debug(e);
                        });
                        const o = this._getSpawnFileName();
                        const a = s.spawn(o, this._getSpawnArgs(r), this._getSpawnOptions(this.options, o));
                        const c = '';
                        if (a.stdout) {
                            a.stdout.on('data', e => {
                                if (this.options.listeners && this.options.listeners.stdout) {
                                    this.options.listeners.stdout(e);
                                }
                                if (!r.silent && r.outStream) {
                                    r.outStream.write(e);
                                }
                                this._processLineBuffer(e, c, e => {
                                    if (this.options.listeners && this.options.listeners.stdline) {
                                        this.options.listeners.stdline(e);
                                    }
                                });
                            });
                        }
                        const l = '';
                        if (a.stderr) {
                            a.stderr.on('data', e => {
                                i.processStderr = true;
                                if (this.options.listeners && this.options.listeners.stderr) {
                                    this.options.listeners.stderr(e);
                                }
                                if (!r.silent && r.errStream && r.outStream) {
                                    const t = r.failOnStdErr ? r.errStream : r.outStream;
                                    t.write(e);
                                }
                                this._processLineBuffer(e, l, e => {
                                    if (this.options.listeners && this.options.listeners.errline) {
                                        this.options.listeners.errline(e);
                                    }
                                });
                            });
                        }
                        a.on('error', e => {
                            i.processError = e.message;
                            i.processExited = true;
                            i.processClosed = true;
                            i.CheckComplete();
                        });
                        a.on('exit', e => {
                            i.processExitCode = e;
                            i.processExited = true;
                            this._debug(`Exit code ${e} received from tool '${this.toolPath}'`);
                            i.CheckComplete();
                        });
                        a.on('close', e => {
                            i.processExitCode = e;
                            i.processExited = true;
                            i.processClosed = true;
                            this._debug(`STDIO streams have closed for tool '${this.toolPath}'`);
                            i.CheckComplete();
                        });
                        i.on('done', (r, i) => {
                            if (c.length > 0) {
                                this.emit('stdline', c);
                            }
                            if (l.length > 0) {
                                this.emit('errline', l);
                            }
                            a.removeAllListeners();
                            if (r) {
                                t(r);
                            } else {
                                e(i);
                            }
                        });
                    });
                });
            }
        }
        t.ToolRunner = ToolRunner;
        function argStringToArray(e) {
            const t = [];
            let r = false;
            let i = false;
            let n = '';
            function append(e) {
                if (i && e !== '"') {
                    n += '\\';
                }
                n += e;
                i = false;
            }
            for (let o = 0; o < e.length; o++) {
                const s = e.charAt(o);
                if (s === '"') {
                    if (!i) {
                        r = !r;
                    } else {
                        append(s);
                    }
                    continue;
                }
                if (s === '\\' && i) {
                    append(s);
                    continue;
                }
                if (s === '\\' && r) {
                    i = true;
                    continue;
                }
                if (s === ' ' && !r) {
                    if (n.length > 0) {
                        t.push(n);
                        n = '';
                    }
                    continue;
                }
                append(s);
            }
            if (n.length > 0) {
                t.push(n.trim());
            }
            return t;
        }
        t.argStringToArray = argStringToArray;
        class ExecState extends o.EventEmitter {
            constructor(e, t) {
                super();
                this.processClosed = false;
                this.processError = '';
                this.processExitCode = 0;
                this.processExited = false;
                this.processStderr = false;
                this.delay = 1e4;
                this.done = false;
                this.timeout = null;
                if (!t) {
                    throw new Error('toolPath must not be empty');
                }
                this.options = e;
                this.toolPath = t;
                if (e.delay) {
                    this.delay = e.delay;
                }
            }
            CheckComplete() {
                if (this.done) {
                    return;
                }
                if (this.processClosed) {
                    this._setResult();
                } else if (this.processExited) {
                    this.timeout = setTimeout(ExecState.HandleTimeout, this.delay, this);
                }
            }
            _debug(e) {
                this.emit('debug', e);
            }
            _setResult() {
                let e;
                if (this.processExited) {
                    if (this.processError) {
                        e = new Error(
                            `There was an error when attempting to execute the process '${this.toolPath}'. This may indicate the process failed to start. Error: ${this.processError}`
                        );
                    } else if (this.processExitCode !== 0 && !this.options.ignoreReturnCode) {
                        e = new Error(`The process '${this.toolPath}' failed with exit code ${this.processExitCode}`);
                    } else if (this.processStderr && this.options.failOnStdErr) {
                        e = new Error(
                            `The process '${this.toolPath}' failed because one or more lines were written to the STDERR stream`
                        );
                    }
                }
                if (this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                }
                this.done = true;
                this.emit('done', e, this.processExitCode);
            }
            static HandleTimeout(e) {
                if (e.done) {
                    return;
                }
                if (!e.processClosed && e.processExited) {
                    const t = `The STDIO streams did not close within ${e.delay /
                        1e3} seconds of the exit event from process '${
                        e.toolPath
                    }'. This may indicate a child process inherited the STDIO streams and has not yet exited.`;
                    e._debug(t);
                }
                e._setResult();
            }
        }
    },
    16: function(e) {
        e.exports = require('tls');
    },
    87: function(e) {
        e.exports = require('os');
    },
    129: function(e) {
        e.exports = require('child_process');
    },
    131: function(e, t, r) {
        'use strict';
        var i =
            (this && this.__awaiter) ||
            function(e, t, r, i) {
                function adopt(e) {
                    return e instanceof r
                        ? e
                        : new r(function(t) {
                              t(e);
                          });
                }
                return new (r || (r = Promise))(function(r, n) {
                    function fulfilled(e) {
                        try {
                            step(i.next(e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function rejected(e) {
                        try {
                            step(i['throw'](e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function step(e) {
                        e.done ? r(e.value) : adopt(e.value).then(fulfilled, rejected);
                    }
                    step((i = i.apply(e, t || [])).next());
                });
            };
        var n =
            (this && this.__importStar) ||
            function(e) {
                if (e && e.__esModule) return e;
                var t = {};
                if (e != null) for (var r in e) if (Object.hasOwnProperty.call(e, r)) t[r] = e[r];
                t['default'] = e;
                return t;
            };
        Object.defineProperty(t, '__esModule', { value: true });
        const o = r(470);
        const s = r(986);
        const a = r(533);
        const c = r(87);
        const l = n(r(622));
        function main() {
            return i(this, void 0, void 0, function*() {
                const e = o.getInput('rust-version');
                try {
                    yield installRustup();
                    yield installToolchain(e);
                    yield installWasmPack();
                } catch (e) {
                    o.setFailed(`Error: ${e}`);
                }
            });
        }
        function installRustup() {
            return i(this, void 0, void 0, function*() {
                o.debug('Installing rustup');
                const e = yield a.downloadTool('https://sh.rustup.rs');
                yield s.exec('sh', [e, '-y', '--default-toolchain', 'none']);
                o.addPath(l.join(c.homedir(), '.cargo', 'bin'));
            });
        }
        function installToolchain(e = 'stable') {
            return i(this, void 0, void 0, function*() {
                yield s.exec('rustup', ['toolchain', 'install', e]);
                yield s.exec('rustup', ['default', e]);
            });
        }
        function installWasmPack() {
            return i(this, void 0, void 0, function*() {
                const e = yield a.downloadTool('https://rustwasm.github.io/wasm-pack/installer/init.sh');
                yield s.exec('sh', [e]);
            });
        }
        main().catch(e => {
            console.error(e);
            process.exit(1);
        });
    },
    139: function(e, t, r) {
        var i = r(417);
        e.exports = function nodeRNG() {
            return i.randomBytes(16);
        };
    },
    141: function(e, t, r) {
        'use strict';
        var i = r(631);
        var n = r(16);
        var o = r(605);
        var s = r(211);
        var a = r(614);
        var c = r(357);
        var l = r(669);
        t.httpOverHttp = httpOverHttp;
        t.httpsOverHttp = httpsOverHttp;
        t.httpOverHttps = httpOverHttps;
        t.httpsOverHttps = httpsOverHttps;
        function httpOverHttp(e) {
            var t = new TunnelingAgent(e);
            t.request = o.request;
            return t;
        }
        function httpsOverHttp(e) {
            var t = new TunnelingAgent(e);
            t.request = o.request;
            t.createSocket = createSecureSocket;
            t.defaultPort = 443;
            return t;
        }
        function httpOverHttps(e) {
            var t = new TunnelingAgent(e);
            t.request = s.request;
            return t;
        }
        function httpsOverHttps(e) {
            var t = new TunnelingAgent(e);
            t.request = s.request;
            t.createSocket = createSecureSocket;
            t.defaultPort = 443;
            return t;
        }
        function TunnelingAgent(e) {
            var t = this;
            t.options = e || {};
            t.proxyOptions = t.options.proxy || {};
            t.maxSockets = t.options.maxSockets || o.Agent.defaultMaxSockets;
            t.requests = [];
            t.sockets = [];
            t.on('free', function onFree(e, r, i, n) {
                var o = toOptions(r, i, n);
                for (var s = 0, a = t.requests.length; s < a; ++s) {
                    var c = t.requests[s];
                    if (c.host === o.host && c.port === o.port) {
                        t.requests.splice(s, 1);
                        c.request.onSocket(e);
                        return;
                    }
                }
                e.destroy();
                t.removeSocket(e);
            });
        }
        l.inherits(TunnelingAgent, a.EventEmitter);
        TunnelingAgent.prototype.addRequest = function addRequest(e, t, r, i) {
            var n = this;
            var o = mergeOptions({ request: e }, n.options, toOptions(t, r, i));
            if (n.sockets.length >= this.maxSockets) {
                n.requests.push(o);
                return;
            }
            n.createSocket(o, function(t) {
                t.on('free', onFree);
                t.on('close', onCloseOrRemove);
                t.on('agentRemove', onCloseOrRemove);
                e.onSocket(t);
                function onFree() {
                    n.emit('free', t, o);
                }
                function onCloseOrRemove(e) {
                    n.removeSocket(t);
                    t.removeListener('free', onFree);
                    t.removeListener('close', onCloseOrRemove);
                    t.removeListener('agentRemove', onCloseOrRemove);
                }
            });
        };
        TunnelingAgent.prototype.createSocket = function createSocket(e, t) {
            var r = this;
            var i = {};
            r.sockets.push(i);
            var n = mergeOptions({}, r.proxyOptions, {
                method: 'CONNECT',
                path: e.host + ':' + e.port,
                agent: false,
                headers: { host: e.host + ':' + e.port },
            });
            if (e.localAddress) {
                n.localAddress = e.localAddress;
            }
            if (n.proxyAuth) {
                n.headers = n.headers || {};
                n.headers['Proxy-Authorization'] = 'Basic ' + new Buffer(n.proxyAuth).toString('base64');
            }
            u('making CONNECT request');
            var o = r.request(n);
            o.useChunkedEncodingByDefault = false;
            o.once('response', onResponse);
            o.once('upgrade', onUpgrade);
            o.once('connect', onConnect);
            o.once('error', onError);
            o.end();
            function onResponse(e) {
                e.upgrade = true;
            }
            function onUpgrade(e, t, r) {
                process.nextTick(function() {
                    onConnect(e, t, r);
                });
            }
            function onConnect(n, s, a) {
                o.removeAllListeners();
                s.removeAllListeners();
                if (n.statusCode !== 200) {
                    u('tunneling socket could not be established, statusCode=%d', n.statusCode);
                    s.destroy();
                    var c = new Error('tunneling socket could not be established, ' + 'statusCode=' + n.statusCode);
                    c.code = 'ECONNRESET';
                    e.request.emit('error', c);
                    r.removeSocket(i);
                    return;
                }
                if (a.length > 0) {
                    u('got illegal response body from proxy');
                    s.destroy();
                    var c = new Error('got illegal response body from proxy');
                    c.code = 'ECONNRESET';
                    e.request.emit('error', c);
                    r.removeSocket(i);
                    return;
                }
                u('tunneling connection has established');
                r.sockets[r.sockets.indexOf(i)] = s;
                return t(s);
            }
            function onError(t) {
                o.removeAllListeners();
                u('tunneling socket could not be established, cause=%s\n', t.message, t.stack);
                var n = new Error('tunneling socket could not be established, ' + 'cause=' + t.message);
                n.code = 'ECONNRESET';
                e.request.emit('error', n);
                r.removeSocket(i);
            }
        };
        TunnelingAgent.prototype.removeSocket = function removeSocket(e) {
            var t = this.sockets.indexOf(e);
            if (t === -1) {
                return;
            }
            this.sockets.splice(t, 1);
            var r = this.requests.shift();
            if (r) {
                this.createSocket(r, function(e) {
                    r.request.onSocket(e);
                });
            }
        };
        function createSecureSocket(e, t) {
            var r = this;
            TunnelingAgent.prototype.createSocket.call(r, e, function(i) {
                var o = e.request.getHeader('host');
                var s = mergeOptions({}, r.options, { socket: i, servername: o ? o.replace(/:.*$/, '') : e.host });
                var a = n.connect(0, s);
                r.sockets[r.sockets.indexOf(i)] = a;
                t(a);
            });
        }
        function toOptions(e, t, r) {
            if (typeof e === 'string') {
                return { host: e, port: t, localAddress: r };
            }
            return e;
        }
        function mergeOptions(e) {
            for (var t = 1, r = arguments.length; t < r; ++t) {
                var i = arguments[t];
                if (typeof i === 'object') {
                    var n = Object.keys(i);
                    for (var o = 0, s = n.length; o < s; ++o) {
                        var a = n[o];
                        if (i[a] !== undefined) {
                            e[a] = i[a];
                        }
                    }
                }
            }
            return e;
        }
        var u;
        if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
            u = function() {
                var e = Array.prototype.slice.call(arguments);
                if (typeof e[0] === 'string') {
                    e[0] = 'TUNNEL: ' + e[0];
                } else {
                    e.unshift('TUNNEL:');
                }
                console.error.apply(console, e);
            };
        } else {
            u = function() {};
        }
        t.debug = u;
    },
    211: function(e) {
        e.exports = require('https');
    },
    357: function(e) {
        e.exports = require('assert');
    },
    413: function(e, t, r) {
        e.exports = r(141);
    },
    417: function(e) {
        e.exports = require('crypto');
    },
    431: function(e, t, r) {
        'use strict';
        var i =
            (this && this.__importStar) ||
            function(e) {
                if (e && e.__esModule) return e;
                var t = {};
                if (e != null) for (var r in e) if (Object.hasOwnProperty.call(e, r)) t[r] = e[r];
                t['default'] = e;
                return t;
            };
        Object.defineProperty(t, '__esModule', { value: true });
        const n = i(r(87));
        function issueCommand(e, t, r) {
            const i = new Command(e, t, r);
            process.stdout.write(i.toString() + n.EOL);
        }
        t.issueCommand = issueCommand;
        function issue(e, t = '') {
            issueCommand(e, {}, t);
        }
        t.issue = issue;
        const o = '::';
        class Command {
            constructor(e, t, r) {
                if (!e) {
                    e = 'missing.command';
                }
                this.command = e;
                this.properties = t;
                this.message = r;
            }
            toString() {
                let e = o + this.command;
                if (this.properties && Object.keys(this.properties).length > 0) {
                    e += ' ';
                    let t = true;
                    for (const r in this.properties) {
                        if (this.properties.hasOwnProperty(r)) {
                            const i = this.properties[r];
                            if (i) {
                                if (t) {
                                    t = false;
                                } else {
                                    e += ',';
                                }
                                e += `${r}=${escapeProperty(i)}`;
                            }
                        }
                    }
                }
                e += `${o}${escapeData(this.message)}`;
                return e;
            }
        }
        function escapeData(e) {
            return (e || '')
                .replace(/%/g, '%25')
                .replace(/\r/g, '%0D')
                .replace(/\n/g, '%0A');
        }
        function escapeProperty(e) {
            return (e || '')
                .replace(/%/g, '%25')
                .replace(/\r/g, '%0D')
                .replace(/\n/g, '%0A')
                .replace(/:/g, '%3A')
                .replace(/,/g, '%2C');
        }
    },
    470: function(e, t, r) {
        'use strict';
        var i =
            (this && this.__awaiter) ||
            function(e, t, r, i) {
                function adopt(e) {
                    return e instanceof r
                        ? e
                        : new r(function(t) {
                              t(e);
                          });
                }
                return new (r || (r = Promise))(function(r, n) {
                    function fulfilled(e) {
                        try {
                            step(i.next(e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function rejected(e) {
                        try {
                            step(i['throw'](e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function step(e) {
                        e.done ? r(e.value) : adopt(e.value).then(fulfilled, rejected);
                    }
                    step((i = i.apply(e, t || [])).next());
                });
            };
        var n =
            (this && this.__importStar) ||
            function(e) {
                if (e && e.__esModule) return e;
                var t = {};
                if (e != null) for (var r in e) if (Object.hasOwnProperty.call(e, r)) t[r] = e[r];
                t['default'] = e;
                return t;
            };
        Object.defineProperty(t, '__esModule', { value: true });
        const o = r(431);
        const s = n(r(87));
        const a = n(r(622));
        var c;
        (function(e) {
            e[(e['Success'] = 0)] = 'Success';
            e[(e['Failure'] = 1)] = 'Failure';
        })((c = t.ExitCode || (t.ExitCode = {})));
        function exportVariable(e, t) {
            process.env[e] = t;
            o.issueCommand('set-env', { name: e }, t);
        }
        t.exportVariable = exportVariable;
        function setSecret(e) {
            o.issueCommand('add-mask', {}, e);
        }
        t.setSecret = setSecret;
        function addPath(e) {
            o.issueCommand('add-path', {}, e);
            process.env['PATH'] = `${e}${a.delimiter}${process.env['PATH']}`;
        }
        t.addPath = addPath;
        function getInput(e, t) {
            const r = process.env[`INPUT_${e.replace(/ /g, '_').toUpperCase()}`] || '';
            if (t && t.required && !r) {
                throw new Error(`Input required and not supplied: ${e}`);
            }
            return r.trim();
        }
        t.getInput = getInput;
        function setOutput(e, t) {
            o.issueCommand('set-output', { name: e }, t);
        }
        t.setOutput = setOutput;
        function setFailed(e) {
            process.exitCode = c.Failure;
            error(e);
        }
        t.setFailed = setFailed;
        function debug(e) {
            o.issueCommand('debug', {}, e);
        }
        t.debug = debug;
        function error(e) {
            o.issue('error', e);
        }
        t.error = error;
        function warning(e) {
            o.issue('warning', e);
        }
        t.warning = warning;
        function info(e) {
            process.stdout.write(e + s.EOL);
        }
        t.info = info;
        function startGroup(e) {
            o.issue('group', e);
        }
        t.startGroup = startGroup;
        function endGroup() {
            o.issue('endgroup');
        }
        t.endGroup = endGroup;
        function group(e, t) {
            return i(this, void 0, void 0, function*() {
                startGroup(e);
                let r;
                try {
                    r = yield t();
                } finally {
                    endGroup();
                }
                return r;
            });
        }
        t.group = group;
        function saveState(e, t) {
            o.issueCommand('save-state', { name: e }, t);
        }
        t.saveState = saveState;
        function getState(e) {
            return process.env[`STATE_${e}`] || '';
        }
        t.getState = getState;
    },
    533: function(e, t, r) {
        'use strict';
        var i =
            (this && this.__awaiter) ||
            function(e, t, r, i) {
                function adopt(e) {
                    return e instanceof r
                        ? e
                        : new r(function(t) {
                              t(e);
                          });
                }
                return new (r || (r = Promise))(function(r, n) {
                    function fulfilled(e) {
                        try {
                            step(i.next(e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function rejected(e) {
                        try {
                            step(i['throw'](e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function step(e) {
                        e.done ? r(e.value) : adopt(e.value).then(fulfilled, rejected);
                    }
                    step((i = i.apply(e, t || [])).next());
                });
            };
        var n =
            (this && this.__importStar) ||
            function(e) {
                if (e && e.__esModule) return e;
                var t = {};
                if (e != null) for (var r in e) if (Object.hasOwnProperty.call(e, r)) t[r] = e[r];
                t['default'] = e;
                return t;
            };
        var o =
            (this && this.__importDefault) ||
            function(e) {
                return e && e.__esModule ? e : { default: e };
            };
        Object.defineProperty(t, '__esModule', { value: true });
        const s = n(r(470));
        const a = n(r(1));
        const c = n(r(747));
        const l = n(r(87));
        const u = n(r(622));
        const p = n(r(539));
        const f = n(r(550));
        const d = o(r(826));
        const h = r(986);
        const m = r(357);
        class HTTPError extends Error {
            constructor(e) {
                super(`Unexpected HTTP response: ${e}`);
                this.httpStatusCode = e;
                Object.setPrototypeOf(this, new.target.prototype);
            }
        }
        t.HTTPError = HTTPError;
        const E = process.platform === 'win32';
        const v = 'actions/tool-cache';
        let g = process.env['RUNNER_TEMP'] || '';
        let y = process.env['RUNNER_TOOL_CACHE'] || '';
        if (!g || !y) {
            let e;
            if (E) {
                e = process.env['USERPROFILE'] || 'C:\\';
            } else {
                if (process.platform === 'darwin') {
                    e = '/Users';
                } else {
                    e = '/home';
                }
            }
            if (!g) {
                g = u.join(e, 'actions', 'temp');
            }
            if (!y) {
                y = u.join(e, 'actions', 'cache');
            }
        }
        function downloadTool(e, t) {
            return i(this, void 0, void 0, function*() {
                return new Promise((r, n) =>
                    i(this, void 0, void 0, function*() {
                        try {
                            const o = new p.HttpClient(v, [], { allowRetries: true, maxRetries: 3 });
                            t = t || u.join(g, d.default());
                            yield a.mkdirP(u.dirname(t));
                            s.debug(`Downloading ${e}`);
                            s.debug(`Downloading ${t}`);
                            if (c.existsSync(t)) {
                                throw new Error(`Destination file path ${t} already exists`);
                            }
                            const l = yield o.get(e);
                            if (l.message.statusCode !== 200) {
                                const t = new HTTPError(l.message.statusCode);
                                s.debug(
                                    `Failed to download from "${e}". Code(${l.message.statusCode}) Message(${l.message.statusMessage})`
                                );
                                throw t;
                            }
                            const f = c.createWriteStream(t);
                            f.on('open', () =>
                                i(this, void 0, void 0, function*() {
                                    try {
                                        const i = l.message.pipe(f);
                                        i.on('close', () => {
                                            s.debug('download complete');
                                            r(t);
                                        });
                                    } catch (t) {
                                        s.debug(
                                            `Failed to download from "${e}". Code(${l.message.statusCode}) Message(${l.message.statusMessage})`
                                        );
                                        n(t);
                                    }
                                })
                            );
                            f.on('error', e => {
                                f.end();
                                n(e);
                            });
                        } catch (e) {
                            n(e);
                        }
                    })
                );
            });
        }
        t.downloadTool = downloadTool;
        function extract7z(e, t, r) {
            return i(this, void 0, void 0, function*() {
                m.ok(E, 'extract7z() not supported on current OS');
                m.ok(e, 'parameter "file" is required');
                t = yield _createExtractFolder(t);
                const i = process.cwd();
                process.chdir(t);
                if (r) {
                    try {
                        const t = ['x', '-bb1', '-bd', '-sccUTF-8', e];
                        const n = { silent: true };
                        yield h.exec(`"${r}"`, t, n);
                    } finally {
                        process.chdir(i);
                    }
                } else {
                    const r = u
                        .join(__dirname, '..', 'scripts', 'Invoke-7zdec.ps1')
                        .replace(/'/g, "''")
                        .replace(/"|\n|\r/g, '');
                    const n = e.replace(/'/g, "''").replace(/"|\n|\r/g, '');
                    const o = t.replace(/'/g, "''").replace(/"|\n|\r/g, '');
                    const s = `& '${r}' -Source '${n}' -Target '${o}'`;
                    const c = [
                        '-NoLogo',
                        '-Sta',
                        '-NoProfile',
                        '-NonInteractive',
                        '-ExecutionPolicy',
                        'Unrestricted',
                        '-Command',
                        s,
                    ];
                    const l = { silent: true };
                    try {
                        const e = yield a.which('powershell', true);
                        yield h.exec(`"${e}"`, c, l);
                    } finally {
                        process.chdir(i);
                    }
                }
                return t;
            });
        }
        t.extract7z = extract7z;
        function extractTar(e, t, r = 'xz') {
            return i(this, void 0, void 0, function*() {
                if (!e) {
                    throw new Error("parameter 'file' is required");
                }
                t = yield _createExtractFolder(t);
                let i = '';
                yield h.exec('tar --version', [], {
                    ignoreReturnCode: true,
                    listeners: { stdout: e => (i += e.toString()), stderr: e => (i += e.toString()) },
                });
                const n = i.toUpperCase().includes('GNU TAR');
                const o = [r];
                let s = t;
                let a = e;
                if (E && n) {
                    o.push('--force-local');
                    s = t.replace(/\\/g, '/');
                    a = e.replace(/\\/g, '/');
                }
                if (n) {
                    o.push('--warning=no-unknown-keyword');
                }
                o.push('-C', s, '-f', a);
                yield h.exec(`tar`, o);
                return t;
            });
        }
        t.extractTar = extractTar;
        function extractZip(e, t) {
            return i(this, void 0, void 0, function*() {
                if (!e) {
                    throw new Error("parameter 'file' is required");
                }
                t = yield _createExtractFolder(t);
                if (E) {
                    yield extractZipWin(e, t);
                } else {
                    yield extractZipNix(e, t);
                }
                return t;
            });
        }
        t.extractZip = extractZip;
        function extractZipWin(e, t) {
            return i(this, void 0, void 0, function*() {
                const r = e.replace(/'/g, "''").replace(/"|\n|\r/g, '');
                const i = t.replace(/'/g, "''").replace(/"|\n|\r/g, '');
                const n = `$ErrorActionPreference = 'Stop' ; try { Add-Type -AssemblyName System.IO.Compression.FileSystem } catch { } ; [System.IO.Compression.ZipFile]::ExtractToDirectory('${r}', '${i}')`;
                const o = yield a.which('powershell');
                const s = [
                    '-NoLogo',
                    '-Sta',
                    '-NoProfile',
                    '-NonInteractive',
                    '-ExecutionPolicy',
                    'Unrestricted',
                    '-Command',
                    n,
                ];
                yield h.exec(`"${o}"`, s);
            });
        }
        function extractZipNix(e, t) {
            return i(this, void 0, void 0, function*() {
                const r = yield a.which('unzip');
                yield h.exec(`"${r}"`, [e], { cwd: t });
            });
        }
        function cacheDir(e, t, r, n) {
            return i(this, void 0, void 0, function*() {
                r = f.clean(r) || r;
                n = n || l.arch();
                s.debug(`Caching tool ${t} ${r} ${n}`);
                s.debug(`source dir: ${e}`);
                if (!c.statSync(e).isDirectory()) {
                    throw new Error('sourceDir is not a directory');
                }
                const i = yield _createToolPath(t, r, n);
                for (const t of c.readdirSync(e)) {
                    const r = u.join(e, t);
                    yield a.cp(r, i, { recursive: true });
                }
                _completeToolPath(t, r, n);
                return i;
            });
        }
        t.cacheDir = cacheDir;
        function cacheFile(e, t, r, n, o) {
            return i(this, void 0, void 0, function*() {
                n = f.clean(n) || n;
                o = o || l.arch();
                s.debug(`Caching tool ${r} ${n} ${o}`);
                s.debug(`source file: ${e}`);
                if (!c.statSync(e).isFile()) {
                    throw new Error('sourceFile is not a file');
                }
                const i = yield _createToolPath(r, n, o);
                const p = u.join(i, t);
                s.debug(`destination file ${p}`);
                yield a.cp(e, p);
                _completeToolPath(r, n, o);
                return i;
            });
        }
        t.cacheFile = cacheFile;
        function find(e, t, r) {
            if (!e) {
                throw new Error('toolName parameter is required');
            }
            if (!t) {
                throw new Error('versionSpec parameter is required');
            }
            r = r || l.arch();
            if (!_isExplicitVersion(t)) {
                const i = findAllVersions(e, r);
                const n = _evaluateVersions(i, t);
                t = n;
            }
            let i = '';
            if (t) {
                t = f.clean(t) || '';
                const n = u.join(y, e, t, r);
                s.debug(`checking cache: ${n}`);
                if (c.existsSync(n) && c.existsSync(`${n}.complete`)) {
                    s.debug(`Found tool in cache ${e} ${t} ${r}`);
                    i = n;
                } else {
                    s.debug('not found');
                }
            }
            return i;
        }
        t.find = find;
        function findAllVersions(e, t) {
            const r = [];
            t = t || l.arch();
            const i = u.join(y, e);
            if (c.existsSync(i)) {
                const e = c.readdirSync(i);
                for (const n of e) {
                    if (_isExplicitVersion(n)) {
                        const e = u.join(i, n, t || '');
                        if (c.existsSync(e) && c.existsSync(`${e}.complete`)) {
                            r.push(n);
                        }
                    }
                }
            }
            return r;
        }
        t.findAllVersions = findAllVersions;
        function _createExtractFolder(e) {
            return i(this, void 0, void 0, function*() {
                if (!e) {
                    e = u.join(g, d.default());
                }
                yield a.mkdirP(e);
                return e;
            });
        }
        function _createToolPath(e, t, r) {
            return i(this, void 0, void 0, function*() {
                const i = u.join(y, e, f.clean(t) || t, r || '');
                s.debug(`destination ${i}`);
                const n = `${i}.complete`;
                yield a.rmRF(i);
                yield a.rmRF(n);
                yield a.mkdirP(i);
                return i;
            });
        }
        function _completeToolPath(e, t, r) {
            const i = u.join(y, e, f.clean(t) || t, r || '');
            const n = `${i}.complete`;
            c.writeFileSync(n, '');
            s.debug('finished caching tool');
        }
        function _isExplicitVersion(e) {
            const t = f.clean(e) || '';
            s.debug(`isExplicit: ${t}`);
            const r = f.valid(t) != null;
            s.debug(`explicit? ${r}`);
            return r;
        }
        function _evaluateVersions(e, t) {
            let r = '';
            s.debug(`evaluating ${e.length} versions`);
            e = e.sort((e, t) => {
                if (f.gt(e, t)) {
                    return 1;
                }
                return -1;
            });
            for (let i = e.length - 1; i >= 0; i--) {
                const n = e[i];
                const o = f.satisfies(n, t);
                if (o) {
                    r = n;
                    break;
                }
            }
            if (r) {
                s.debug(`matched: ${r}`);
            } else {
                s.debug('match not found');
            }
            return r;
        }
    },
    539: function(e, t, r) {
        'use strict';
        Object.defineProperty(t, '__esModule', { value: true });
        const i = r(835);
        const n = r(605);
        const o = r(211);
        const s = r(950);
        let a;
        var c;
        (function(e) {
            e[(e['OK'] = 200)] = 'OK';
            e[(e['MultipleChoices'] = 300)] = 'MultipleChoices';
            e[(e['MovedPermanently'] = 301)] = 'MovedPermanently';
            e[(e['ResourceMoved'] = 302)] = 'ResourceMoved';
            e[(e['SeeOther'] = 303)] = 'SeeOther';
            e[(e['NotModified'] = 304)] = 'NotModified';
            e[(e['UseProxy'] = 305)] = 'UseProxy';
            e[(e['SwitchProxy'] = 306)] = 'SwitchProxy';
            e[(e['TemporaryRedirect'] = 307)] = 'TemporaryRedirect';
            e[(e['PermanentRedirect'] = 308)] = 'PermanentRedirect';
            e[(e['BadRequest'] = 400)] = 'BadRequest';
            e[(e['Unauthorized'] = 401)] = 'Unauthorized';
            e[(e['PaymentRequired'] = 402)] = 'PaymentRequired';
            e[(e['Forbidden'] = 403)] = 'Forbidden';
            e[(e['NotFound'] = 404)] = 'NotFound';
            e[(e['MethodNotAllowed'] = 405)] = 'MethodNotAllowed';
            e[(e['NotAcceptable'] = 406)] = 'NotAcceptable';
            e[(e['ProxyAuthenticationRequired'] = 407)] = 'ProxyAuthenticationRequired';
            e[(e['RequestTimeout'] = 408)] = 'RequestTimeout';
            e[(e['Conflict'] = 409)] = 'Conflict';
            e[(e['Gone'] = 410)] = 'Gone';
            e[(e['InternalServerError'] = 500)] = 'InternalServerError';
            e[(e['NotImplemented'] = 501)] = 'NotImplemented';
            e[(e['BadGateway'] = 502)] = 'BadGateway';
            e[(e['ServiceUnavailable'] = 503)] = 'ServiceUnavailable';
            e[(e['GatewayTimeout'] = 504)] = 'GatewayTimeout';
        })((c = t.HttpCodes || (t.HttpCodes = {})));
        var l;
        (function(e) {
            e['Accept'] = 'accept';
            e['ContentType'] = 'content-type';
        })((l = t.Headers || (t.Headers = {})));
        var u;
        (function(e) {
            e['ApplicationJson'] = 'application/json';
        })((u = t.MediaTypes || (t.MediaTypes = {})));
        function getProxyUrl(e) {
            let t = s.getProxyUrl(i.parse(e));
            return t ? t.href : '';
        }
        t.getProxyUrl = getProxyUrl;
        const p = [c.MovedPermanently, c.ResourceMoved, c.SeeOther, c.TemporaryRedirect, c.PermanentRedirect];
        const f = [c.BadGateway, c.ServiceUnavailable, c.GatewayTimeout];
        const d = ['OPTIONS', 'GET', 'DELETE', 'HEAD'];
        const h = 10;
        const m = 5;
        class HttpClientResponse {
            constructor(e) {
                this.message = e;
            }
            readBody() {
                return new Promise(async (e, t) => {
                    let r = Buffer.alloc(0);
                    this.message.on('data', e => {
                        r = Buffer.concat([r, e]);
                    });
                    this.message.on('end', () => {
                        e(r.toString());
                    });
                });
            }
        }
        t.HttpClientResponse = HttpClientResponse;
        function isHttps(e) {
            let t = i.parse(e);
            return t.protocol === 'https:';
        }
        t.isHttps = isHttps;
        class HttpClient {
            constructor(e, t, r) {
                this._ignoreSslError = false;
                this._allowRedirects = true;
                this._allowRedirectDowngrade = false;
                this._maxRedirects = 50;
                this._allowRetries = false;
                this._maxRetries = 1;
                this._keepAlive = false;
                this._disposed = false;
                this.userAgent = e;
                this.handlers = t || [];
                this.requestOptions = r;
                if (r) {
                    if (r.ignoreSslError != null) {
                        this._ignoreSslError = r.ignoreSslError;
                    }
                    this._socketTimeout = r.socketTimeout;
                    if (r.allowRedirects != null) {
                        this._allowRedirects = r.allowRedirects;
                    }
                    if (r.allowRedirectDowngrade != null) {
                        this._allowRedirectDowngrade = r.allowRedirectDowngrade;
                    }
                    if (r.maxRedirects != null) {
                        this._maxRedirects = Math.max(r.maxRedirects, 0);
                    }
                    if (r.keepAlive != null) {
                        this._keepAlive = r.keepAlive;
                    }
                    if (r.allowRetries != null) {
                        this._allowRetries = r.allowRetries;
                    }
                    if (r.maxRetries != null) {
                        this._maxRetries = r.maxRetries;
                    }
                }
            }
            options(e, t) {
                return this.request('OPTIONS', e, null, t || {});
            }
            get(e, t) {
                return this.request('GET', e, null, t || {});
            }
            del(e, t) {
                return this.request('DELETE', e, null, t || {});
            }
            post(e, t, r) {
                return this.request('POST', e, t, r || {});
            }
            patch(e, t, r) {
                return this.request('PATCH', e, t, r || {});
            }
            put(e, t, r) {
                return this.request('PUT', e, t, r || {});
            }
            head(e, t) {
                return this.request('HEAD', e, null, t || {});
            }
            sendStream(e, t, r, i) {
                return this.request(e, t, r, i);
            }
            async getJson(e, t = {}) {
                t[l.Accept] = this._getExistingOrDefaultHeader(t, l.Accept, u.ApplicationJson);
                let r = await this.get(e, t);
                return this._processResponse(r, this.requestOptions);
            }
            async postJson(e, t, r = {}) {
                let i = JSON.stringify(t, null, 2);
                r[l.Accept] = this._getExistingOrDefaultHeader(r, l.Accept, u.ApplicationJson);
                r[l.ContentType] = this._getExistingOrDefaultHeader(r, l.ContentType, u.ApplicationJson);
                let n = await this.post(e, i, r);
                return this._processResponse(n, this.requestOptions);
            }
            async putJson(e, t, r = {}) {
                let i = JSON.stringify(t, null, 2);
                r[l.Accept] = this._getExistingOrDefaultHeader(r, l.Accept, u.ApplicationJson);
                r[l.ContentType] = this._getExistingOrDefaultHeader(r, l.ContentType, u.ApplicationJson);
                let n = await this.put(e, i, r);
                return this._processResponse(n, this.requestOptions);
            }
            async patchJson(e, t, r = {}) {
                let i = JSON.stringify(t, null, 2);
                r[l.Accept] = this._getExistingOrDefaultHeader(r, l.Accept, u.ApplicationJson);
                r[l.ContentType] = this._getExistingOrDefaultHeader(r, l.ContentType, u.ApplicationJson);
                let n = await this.patch(e, i, r);
                return this._processResponse(n, this.requestOptions);
            }
            async request(e, t, r, n) {
                if (this._disposed) {
                    throw new Error('Client has already been disposed.');
                }
                let o = i.parse(t);
                let s = this._prepareRequest(e, o, n);
                let a = this._allowRetries && d.indexOf(e) != -1 ? this._maxRetries + 1 : 1;
                let l = 0;
                let u;
                while (l < a) {
                    u = await this.requestRaw(s, r);
                    if (u && u.message && u.message.statusCode === c.Unauthorized) {
                        let e;
                        for (let t = 0; t < this.handlers.length; t++) {
                            if (this.handlers[t].canHandleAuthentication(u)) {
                                e = this.handlers[t];
                                break;
                            }
                        }
                        if (e) {
                            return e.handleAuthentication(this, s, r);
                        } else {
                            return u;
                        }
                    }
                    let t = this._maxRedirects;
                    while (p.indexOf(u.message.statusCode) != -1 && this._allowRedirects && t > 0) {
                        const a = u.message.headers['location'];
                        if (!a) {
                            break;
                        }
                        let c = i.parse(a);
                        if (o.protocol == 'https:' && o.protocol != c.protocol && !this._allowRedirectDowngrade) {
                            throw new Error(
                                'Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.'
                            );
                        }
                        await u.readBody();
                        s = this._prepareRequest(e, c, n);
                        u = await this.requestRaw(s, r);
                        t--;
                    }
                    if (f.indexOf(u.message.statusCode) == -1) {
                        return u;
                    }
                    l += 1;
                    if (l < a) {
                        await u.readBody();
                        await this._performExponentialBackoff(l);
                    }
                }
                return u;
            }
            dispose() {
                if (this._agent) {
                    this._agent.destroy();
                }
                this._disposed = true;
            }
            requestRaw(e, t) {
                return new Promise((r, i) => {
                    let n = function(e, t) {
                        if (e) {
                            i(e);
                        }
                        r(t);
                    };
                    this.requestRawWithCallback(e, t, n);
                });
            }
            requestRawWithCallback(e, t, r) {
                let i;
                if (typeof t === 'string') {
                    e.options.headers['Content-Length'] = Buffer.byteLength(t, 'utf8');
                }
                let n = false;
                let o = (e, t) => {
                    if (!n) {
                        n = true;
                        r(e, t);
                    }
                };
                let s = e.httpModule.request(e.options, e => {
                    let t = new HttpClientResponse(e);
                    o(null, t);
                });
                s.on('socket', e => {
                    i = e;
                });
                s.setTimeout(this._socketTimeout || 3 * 6e4, () => {
                    if (i) {
                        i.end();
                    }
                    o(new Error('Request timeout: ' + e.options.path), null);
                });
                s.on('error', function(e) {
                    o(e, null);
                });
                if (t && typeof t === 'string') {
                    s.write(t, 'utf8');
                }
                if (t && typeof t !== 'string') {
                    t.on('close', function() {
                        s.end();
                    });
                    t.pipe(s);
                } else {
                    s.end();
                }
            }
            getAgent(e) {
                let t = i.parse(e);
                return this._getAgent(t);
            }
            _prepareRequest(e, t, r) {
                const i = {};
                i.parsedUrl = t;
                const s = i.parsedUrl.protocol === 'https:';
                i.httpModule = s ? o : n;
                const a = s ? 443 : 80;
                i.options = {};
                i.options.host = i.parsedUrl.hostname;
                i.options.port = i.parsedUrl.port ? parseInt(i.parsedUrl.port) : a;
                i.options.path = (i.parsedUrl.pathname || '') + (i.parsedUrl.search || '');
                i.options.method = e;
                i.options.headers = this._mergeHeaders(r);
                if (this.userAgent != null) {
                    i.options.headers['user-agent'] = this.userAgent;
                }
                i.options.agent = this._getAgent(i.parsedUrl);
                if (this.handlers) {
                    this.handlers.forEach(e => {
                        e.prepareRequest(i.options);
                    });
                }
                return i;
            }
            _mergeHeaders(e) {
                const t = e => Object.keys(e).reduce((t, r) => ((t[r.toLowerCase()] = e[r]), t), {});
                if (this.requestOptions && this.requestOptions.headers) {
                    return Object.assign({}, t(this.requestOptions.headers), t(e));
                }
                return t(e || {});
            }
            _getExistingOrDefaultHeader(e, t, r) {
                const i = e => Object.keys(e).reduce((t, r) => ((t[r.toLowerCase()] = e[r]), t), {});
                let n;
                if (this.requestOptions && this.requestOptions.headers) {
                    n = i(this.requestOptions.headers)[t];
                }
                return e[t] || n || r;
            }
            _getAgent(e) {
                let t;
                let i = s.getProxyUrl(e);
                let c = i && i.hostname;
                if (this._keepAlive && c) {
                    t = this._proxyAgent;
                }
                if (this._keepAlive && !c) {
                    t = this._agent;
                }
                if (!!t) {
                    return t;
                }
                const l = e.protocol === 'https:';
                let u = 100;
                if (!!this.requestOptions) {
                    u = this.requestOptions.maxSockets || n.globalAgent.maxSockets;
                }
                if (c) {
                    if (!a) {
                        a = r(413);
                    }
                    const e = {
                        maxSockets: u,
                        keepAlive: this._keepAlive,
                        proxy: { proxyAuth: i.auth, host: i.hostname, port: i.port },
                    };
                    let n;
                    const o = i.protocol === 'https:';
                    if (l) {
                        n = o ? a.httpsOverHttps : a.httpsOverHttp;
                    } else {
                        n = o ? a.httpOverHttps : a.httpOverHttp;
                    }
                    t = n(e);
                    this._proxyAgent = t;
                }
                if (this._keepAlive && !t) {
                    const e = { keepAlive: this._keepAlive, maxSockets: u };
                    t = l ? new o.Agent(e) : new n.Agent(e);
                    this._agent = t;
                }
                if (!t) {
                    t = l ? o.globalAgent : n.globalAgent;
                }
                if (l && this._ignoreSslError) {
                    t.options = Object.assign(t.options || {}, { rejectUnauthorized: false });
                }
                return t;
            }
            _performExponentialBackoff(e) {
                e = Math.min(h, e);
                const t = m * Math.pow(2, e);
                return new Promise(e => setTimeout(() => e(), t));
            }
            static dateTimeDeserializer(e, t) {
                if (typeof t === 'string') {
                    let e = new Date(t);
                    if (!isNaN(e.valueOf())) {
                        return e;
                    }
                }
                return t;
            }
            async _processResponse(e, t) {
                return new Promise(async (r, i) => {
                    const n = e.message.statusCode;
                    const o = { statusCode: n, result: null, headers: {} };
                    if (n == c.NotFound) {
                        r(o);
                    }
                    let s;
                    let a;
                    try {
                        a = await e.readBody();
                        if (a && a.length > 0) {
                            if (t && t.deserializeDates) {
                                s = JSON.parse(a, HttpClient.dateTimeDeserializer);
                            } else {
                                s = JSON.parse(a);
                            }
                            o.result = s;
                        }
                        o.headers = e.message.headers;
                    } catch (e) {}
                    if (n > 299) {
                        let e;
                        if (s && s.message) {
                            e = s.message;
                        } else if (a && a.length > 0) {
                            e = a;
                        } else {
                            e = 'Failed request: (' + n + ')';
                        }
                        let t = new Error(e);
                        t['statusCode'] = n;
                        if (o.result) {
                            t['result'] = o.result;
                        }
                        i(t);
                    } else {
                        r(o);
                    }
                });
            }
        }
        t.HttpClient = HttpClient;
    },
    550: function(e, t) {
        t = e.exports = SemVer;
        var r;
        if (
            typeof process === 'object' &&
            process.env &&
            process.env.NODE_DEBUG &&
            /\bsemver\b/i.test(process.env.NODE_DEBUG)
        ) {
            r = function() {
                var e = Array.prototype.slice.call(arguments, 0);
                e.unshift('SEMVER');
                console.log.apply(console, e);
            };
        } else {
            r = function() {};
        }
        t.SEMVER_SPEC_VERSION = '2.0.0';
        var i = 256;
        var n = Number.MAX_SAFE_INTEGER || 9007199254740991;
        var o = 16;
        var s = (t.re = []);
        var a = (t.src = []);
        var c = (t.tokens = {});
        var l = 0;
        function tok(e) {
            c[e] = l++;
        }
        tok('NUMERICIDENTIFIER');
        a[c.NUMERICIDENTIFIER] = '0|[1-9]\\d*';
        tok('NUMERICIDENTIFIERLOOSE');
        a[c.NUMERICIDENTIFIERLOOSE] = '[0-9]+';
        tok('NONNUMERICIDENTIFIER');
        a[c.NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';
        tok('MAINVERSION');
        a[c.MAINVERSION] =
            '(' +
            a[c.NUMERICIDENTIFIER] +
            ')\\.' +
            '(' +
            a[c.NUMERICIDENTIFIER] +
            ')\\.' +
            '(' +
            a[c.NUMERICIDENTIFIER] +
            ')';
        tok('MAINVERSIONLOOSE');
        a[c.MAINVERSIONLOOSE] =
            '(' +
            a[c.NUMERICIDENTIFIERLOOSE] +
            ')\\.' +
            '(' +
            a[c.NUMERICIDENTIFIERLOOSE] +
            ')\\.' +
            '(' +
            a[c.NUMERICIDENTIFIERLOOSE] +
            ')';
        tok('PRERELEASEIDENTIFIER');
        a[c.PRERELEASEIDENTIFIER] = '(?:' + a[c.NUMERICIDENTIFIER] + '|' + a[c.NONNUMERICIDENTIFIER] + ')';
        tok('PRERELEASEIDENTIFIERLOOSE');
        a[c.PRERELEASEIDENTIFIERLOOSE] = '(?:' + a[c.NUMERICIDENTIFIERLOOSE] + '|' + a[c.NONNUMERICIDENTIFIER] + ')';
        tok('PRERELEASE');
        a[c.PRERELEASE] = '(?:-(' + a[c.PRERELEASEIDENTIFIER] + '(?:\\.' + a[c.PRERELEASEIDENTIFIER] + ')*))';
        tok('PRERELEASELOOSE');
        a[c.PRERELEASELOOSE] =
            '(?:-?(' + a[c.PRERELEASEIDENTIFIERLOOSE] + '(?:\\.' + a[c.PRERELEASEIDENTIFIERLOOSE] + ')*))';
        tok('BUILDIDENTIFIER');
        a[c.BUILDIDENTIFIER] = '[0-9A-Za-z-]+';
        tok('BUILD');
        a[c.BUILD] = '(?:\\+(' + a[c.BUILDIDENTIFIER] + '(?:\\.' + a[c.BUILDIDENTIFIER] + ')*))';
        tok('FULL');
        tok('FULLPLAIN');
        a[c.FULLPLAIN] = 'v?' + a[c.MAINVERSION] + a[c.PRERELEASE] + '?' + a[c.BUILD] + '?';
        a[c.FULL] = '^' + a[c.FULLPLAIN] + '$';
        tok('LOOSEPLAIN');
        a[c.LOOSEPLAIN] = '[v=\\s]*' + a[c.MAINVERSIONLOOSE] + a[c.PRERELEASELOOSE] + '?' + a[c.BUILD] + '?';
        tok('LOOSE');
        a[c.LOOSE] = '^' + a[c.LOOSEPLAIN] + '$';
        tok('GTLT');
        a[c.GTLT] = '((?:<|>)?=?)';
        tok('XRANGEIDENTIFIERLOOSE');
        a[c.XRANGEIDENTIFIERLOOSE] = a[c.NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
        tok('XRANGEIDENTIFIER');
        a[c.XRANGEIDENTIFIER] = a[c.NUMERICIDENTIFIER] + '|x|X|\\*';
        tok('XRANGEPLAIN');
        a[c.XRANGEPLAIN] =
            '[v=\\s]*(' +
            a[c.XRANGEIDENTIFIER] +
            ')' +
            '(?:\\.(' +
            a[c.XRANGEIDENTIFIER] +
            ')' +
            '(?:\\.(' +
            a[c.XRANGEIDENTIFIER] +
            ')' +
            '(?:' +
            a[c.PRERELEASE] +
            ')?' +
            a[c.BUILD] +
            '?' +
            ')?)?';
        tok('XRANGEPLAINLOOSE');
        a[c.XRANGEPLAINLOOSE] =
            '[v=\\s]*(' +
            a[c.XRANGEIDENTIFIERLOOSE] +
            ')' +
            '(?:\\.(' +
            a[c.XRANGEIDENTIFIERLOOSE] +
            ')' +
            '(?:\\.(' +
            a[c.XRANGEIDENTIFIERLOOSE] +
            ')' +
            '(?:' +
            a[c.PRERELEASELOOSE] +
            ')?' +
            a[c.BUILD] +
            '?' +
            ')?)?';
        tok('XRANGE');
        a[c.XRANGE] = '^' + a[c.GTLT] + '\\s*' + a[c.XRANGEPLAIN] + '$';
        tok('XRANGELOOSE');
        a[c.XRANGELOOSE] = '^' + a[c.GTLT] + '\\s*' + a[c.XRANGEPLAINLOOSE] + '$';
        tok('COERCE');
        a[c.COERCE] =
            '(^|[^\\d])' +
            '(\\d{1,' +
            o +
            '})' +
            '(?:\\.(\\d{1,' +
            o +
            '}))?' +
            '(?:\\.(\\d{1,' +
            o +
            '}))?' +
            '(?:$|[^\\d])';
        tok('COERCERTL');
        s[c.COERCERTL] = new RegExp(a[c.COERCE], 'g');
        tok('LONETILDE');
        a[c.LONETILDE] = '(?:~>?)';
        tok('TILDETRIM');
        a[c.TILDETRIM] = '(\\s*)' + a[c.LONETILDE] + '\\s+';
        s[c.TILDETRIM] = new RegExp(a[c.TILDETRIM], 'g');
        var u = '$1~';
        tok('TILDE');
        a[c.TILDE] = '^' + a[c.LONETILDE] + a[c.XRANGEPLAIN] + '$';
        tok('TILDELOOSE');
        a[c.TILDELOOSE] = '^' + a[c.LONETILDE] + a[c.XRANGEPLAINLOOSE] + '$';
        tok('LONECARET');
        a[c.LONECARET] = '(?:\\^)';
        tok('CARETTRIM');
        a[c.CARETTRIM] = '(\\s*)' + a[c.LONECARET] + '\\s+';
        s[c.CARETTRIM] = new RegExp(a[c.CARETTRIM], 'g');
        var p = '$1^';
        tok('CARET');
        a[c.CARET] = '^' + a[c.LONECARET] + a[c.XRANGEPLAIN] + '$';
        tok('CARETLOOSE');
        a[c.CARETLOOSE] = '^' + a[c.LONECARET] + a[c.XRANGEPLAINLOOSE] + '$';
        tok('COMPARATORLOOSE');
        a[c.COMPARATORLOOSE] = '^' + a[c.GTLT] + '\\s*(' + a[c.LOOSEPLAIN] + ')$|^$';
        tok('COMPARATOR');
        a[c.COMPARATOR] = '^' + a[c.GTLT] + '\\s*(' + a[c.FULLPLAIN] + ')$|^$';
        tok('COMPARATORTRIM');
        a[c.COMPARATORTRIM] = '(\\s*)' + a[c.GTLT] + '\\s*(' + a[c.LOOSEPLAIN] + '|' + a[c.XRANGEPLAIN] + ')';
        s[c.COMPARATORTRIM] = new RegExp(a[c.COMPARATORTRIM], 'g');
        var f = '$1$2$3';
        tok('HYPHENRANGE');
        a[c.HYPHENRANGE] = '^\\s*(' + a[c.XRANGEPLAIN] + ')' + '\\s+-\\s+' + '(' + a[c.XRANGEPLAIN] + ')' + '\\s*$';
        tok('HYPHENRANGELOOSE');
        a[c.HYPHENRANGELOOSE] =
            '^\\s*(' + a[c.XRANGEPLAINLOOSE] + ')' + '\\s+-\\s+' + '(' + a[c.XRANGEPLAINLOOSE] + ')' + '\\s*$';
        tok('STAR');
        a[c.STAR] = '(<|>)?=?\\s*\\*';
        for (var d = 0; d < l; d++) {
            r(d, a[d]);
            if (!s[d]) {
                s[d] = new RegExp(a[d]);
            }
        }
        t.parse = parse;
        function parse(e, t) {
            if (!t || typeof t !== 'object') {
                t = { loose: !!t, includePrerelease: false };
            }
            if (e instanceof SemVer) {
                return e;
            }
            if (typeof e !== 'string') {
                return null;
            }
            if (e.length > i) {
                return null;
            }
            var r = t.loose ? s[c.LOOSE] : s[c.FULL];
            if (!r.test(e)) {
                return null;
            }
            try {
                return new SemVer(e, t);
            } catch (e) {
                return null;
            }
        }
        t.valid = valid;
        function valid(e, t) {
            var r = parse(e, t);
            return r ? r.version : null;
        }
        t.clean = clean;
        function clean(e, t) {
            var r = parse(e.trim().replace(/^[=v]+/, ''), t);
            return r ? r.version : null;
        }
        t.SemVer = SemVer;
        function SemVer(e, t) {
            if (!t || typeof t !== 'object') {
                t = { loose: !!t, includePrerelease: false };
            }
            if (e instanceof SemVer) {
                if (e.loose === t.loose) {
                    return e;
                } else {
                    e = e.version;
                }
            } else if (typeof e !== 'string') {
                throw new TypeError('Invalid Version: ' + e);
            }
            if (e.length > i) {
                throw new TypeError('version is longer than ' + i + ' characters');
            }
            if (!(this instanceof SemVer)) {
                return new SemVer(e, t);
            }
            r('SemVer', e, t);
            this.options = t;
            this.loose = !!t.loose;
            var o = e.trim().match(t.loose ? s[c.LOOSE] : s[c.FULL]);
            if (!o) {
                throw new TypeError('Invalid Version: ' + e);
            }
            this.raw = e;
            this.major = +o[1];
            this.minor = +o[2];
            this.patch = +o[3];
            if (this.major > n || this.major < 0) {
                throw new TypeError('Invalid major version');
            }
            if (this.minor > n || this.minor < 0) {
                throw new TypeError('Invalid minor version');
            }
            if (this.patch > n || this.patch < 0) {
                throw new TypeError('Invalid patch version');
            }
            if (!o[4]) {
                this.prerelease = [];
            } else {
                this.prerelease = o[4].split('.').map(function(e) {
                    if (/^[0-9]+$/.test(e)) {
                        var t = +e;
                        if (t >= 0 && t < n) {
                            return t;
                        }
                    }
                    return e;
                });
            }
            this.build = o[5] ? o[5].split('.') : [];
            this.format();
        }
        SemVer.prototype.format = function() {
            this.version = this.major + '.' + this.minor + '.' + this.patch;
            if (this.prerelease.length) {
                this.version += '-' + this.prerelease.join('.');
            }
            return this.version;
        };
        SemVer.prototype.toString = function() {
            return this.version;
        };
        SemVer.prototype.compare = function(e) {
            r('SemVer.compare', this.version, this.options, e);
            if (!(e instanceof SemVer)) {
                e = new SemVer(e, this.options);
            }
            return this.compareMain(e) || this.comparePre(e);
        };
        SemVer.prototype.compareMain = function(e) {
            if (!(e instanceof SemVer)) {
                e = new SemVer(e, this.options);
            }
            return (
                compareIdentifiers(this.major, e.major) ||
                compareIdentifiers(this.minor, e.minor) ||
                compareIdentifiers(this.patch, e.patch)
            );
        };
        SemVer.prototype.comparePre = function(e) {
            if (!(e instanceof SemVer)) {
                e = new SemVer(e, this.options);
            }
            if (this.prerelease.length && !e.prerelease.length) {
                return -1;
            } else if (!this.prerelease.length && e.prerelease.length) {
                return 1;
            } else if (!this.prerelease.length && !e.prerelease.length) {
                return 0;
            }
            var t = 0;
            do {
                var i = this.prerelease[t];
                var n = e.prerelease[t];
                r('prerelease compare', t, i, n);
                if (i === undefined && n === undefined) {
                    return 0;
                } else if (n === undefined) {
                    return 1;
                } else if (i === undefined) {
                    return -1;
                } else if (i === n) {
                    continue;
                } else {
                    return compareIdentifiers(i, n);
                }
            } while (++t);
        };
        SemVer.prototype.compareBuild = function(e) {
            if (!(e instanceof SemVer)) {
                e = new SemVer(e, this.options);
            }
            var t = 0;
            do {
                var i = this.build[t];
                var n = e.build[t];
                r('prerelease compare', t, i, n);
                if (i === undefined && n === undefined) {
                    return 0;
                } else if (n === undefined) {
                    return 1;
                } else if (i === undefined) {
                    return -1;
                } else if (i === n) {
                    continue;
                } else {
                    return compareIdentifiers(i, n);
                }
            } while (++t);
        };
        SemVer.prototype.inc = function(e, t) {
            switch (e) {
                case 'premajor':
                    this.prerelease.length = 0;
                    this.patch = 0;
                    this.minor = 0;
                    this.major++;
                    this.inc('pre', t);
                    break;
                case 'preminor':
                    this.prerelease.length = 0;
                    this.patch = 0;
                    this.minor++;
                    this.inc('pre', t);
                    break;
                case 'prepatch':
                    this.prerelease.length = 0;
                    this.inc('patch', t);
                    this.inc('pre', t);
                    break;
                case 'prerelease':
                    if (this.prerelease.length === 0) {
                        this.inc('patch', t);
                    }
                    this.inc('pre', t);
                    break;
                case 'major':
                    if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
                        this.major++;
                    }
                    this.minor = 0;
                    this.patch = 0;
                    this.prerelease = [];
                    break;
                case 'minor':
                    if (this.patch !== 0 || this.prerelease.length === 0) {
                        this.minor++;
                    }
                    this.patch = 0;
                    this.prerelease = [];
                    break;
                case 'patch':
                    if (this.prerelease.length === 0) {
                        this.patch++;
                    }
                    this.prerelease = [];
                    break;
                case 'pre':
                    if (this.prerelease.length === 0) {
                        this.prerelease = [0];
                    } else {
                        var r = this.prerelease.length;
                        while (--r >= 0) {
                            if (typeof this.prerelease[r] === 'number') {
                                this.prerelease[r]++;
                                r = -2;
                            }
                        }
                        if (r === -1) {
                            this.prerelease.push(0);
                        }
                    }
                    if (t) {
                        if (this.prerelease[0] === t) {
                            if (isNaN(this.prerelease[1])) {
                                this.prerelease = [t, 0];
                            }
                        } else {
                            this.prerelease = [t, 0];
                        }
                    }
                    break;
                default:
                    throw new Error('invalid increment argument: ' + e);
            }
            this.format();
            this.raw = this.version;
            return this;
        };
        t.inc = inc;
        function inc(e, t, r, i) {
            if (typeof r === 'string') {
                i = r;
                r = undefined;
            }
            try {
                return new SemVer(e, r).inc(t, i).version;
            } catch (e) {
                return null;
            }
        }
        t.diff = diff;
        function diff(e, t) {
            if (eq(e, t)) {
                return null;
            } else {
                var r = parse(e);
                var i = parse(t);
                var n = '';
                if (r.prerelease.length || i.prerelease.length) {
                    n = 'pre';
                    var o = 'prerelease';
                }
                for (var s in r) {
                    if (s === 'major' || s === 'minor' || s === 'patch') {
                        if (r[s] !== i[s]) {
                            return n + s;
                        }
                    }
                }
                return o;
            }
        }
        t.compareIdentifiers = compareIdentifiers;
        var h = /^[0-9]+$/;
        function compareIdentifiers(e, t) {
            var r = h.test(e);
            var i = h.test(t);
            if (r && i) {
                e = +e;
                t = +t;
            }
            return e === t ? 0 : r && !i ? -1 : i && !r ? 1 : e < t ? -1 : 1;
        }
        t.rcompareIdentifiers = rcompareIdentifiers;
        function rcompareIdentifiers(e, t) {
            return compareIdentifiers(t, e);
        }
        t.major = major;
        function major(e, t) {
            return new SemVer(e, t).major;
        }
        t.minor = minor;
        function minor(e, t) {
            return new SemVer(e, t).minor;
        }
        t.patch = patch;
        function patch(e, t) {
            return new SemVer(e, t).patch;
        }
        t.compare = compare;
        function compare(e, t, r) {
            return new SemVer(e, r).compare(new SemVer(t, r));
        }
        t.compareLoose = compareLoose;
        function compareLoose(e, t) {
            return compare(e, t, true);
        }
        t.compareBuild = compareBuild;
        function compareBuild(e, t, r) {
            var i = new SemVer(e, r);
            var n = new SemVer(t, r);
            return i.compare(n) || i.compareBuild(n);
        }
        t.rcompare = rcompare;
        function rcompare(e, t, r) {
            return compare(t, e, r);
        }
        t.sort = sort;
        function sort(e, r) {
            return e.sort(function(e, i) {
                return t.compareBuild(e, i, r);
            });
        }
        t.rsort = rsort;
        function rsort(e, r) {
            return e.sort(function(e, i) {
                return t.compareBuild(i, e, r);
            });
        }
        t.gt = gt;
        function gt(e, t, r) {
            return compare(e, t, r) > 0;
        }
        t.lt = lt;
        function lt(e, t, r) {
            return compare(e, t, r) < 0;
        }
        t.eq = eq;
        function eq(e, t, r) {
            return compare(e, t, r) === 0;
        }
        t.neq = neq;
        function neq(e, t, r) {
            return compare(e, t, r) !== 0;
        }
        t.gte = gte;
        function gte(e, t, r) {
            return compare(e, t, r) >= 0;
        }
        t.lte = lte;
        function lte(e, t, r) {
            return compare(e, t, r) <= 0;
        }
        t.cmp = cmp;
        function cmp(e, t, r, i) {
            switch (t) {
                case '===':
                    if (typeof e === 'object') e = e.version;
                    if (typeof r === 'object') r = r.version;
                    return e === r;
                case '!==':
                    if (typeof e === 'object') e = e.version;
                    if (typeof r === 'object') r = r.version;
                    return e !== r;
                case '':
                case '=':
                case '==':
                    return eq(e, r, i);
                case '!=':
                    return neq(e, r, i);
                case '>':
                    return gt(e, r, i);
                case '>=':
                    return gte(e, r, i);
                case '<':
                    return lt(e, r, i);
                case '<=':
                    return lte(e, r, i);
                default:
                    throw new TypeError('Invalid operator: ' + t);
            }
        }
        t.Comparator = Comparator;
        function Comparator(e, t) {
            if (!t || typeof t !== 'object') {
                t = { loose: !!t, includePrerelease: false };
            }
            if (e instanceof Comparator) {
                if (e.loose === !!t.loose) {
                    return e;
                } else {
                    e = e.value;
                }
            }
            if (!(this instanceof Comparator)) {
                return new Comparator(e, t);
            }
            r('comparator', e, t);
            this.options = t;
            this.loose = !!t.loose;
            this.parse(e);
            if (this.semver === m) {
                this.value = '';
            } else {
                this.value = this.operator + this.semver.version;
            }
            r('comp', this);
        }
        var m = {};
        Comparator.prototype.parse = function(e) {
            var t = this.options.loose ? s[c.COMPARATORLOOSE] : s[c.COMPARATOR];
            var r = e.match(t);
            if (!r) {
                throw new TypeError('Invalid comparator: ' + e);
            }
            this.operator = r[1] !== undefined ? r[1] : '';
            if (this.operator === '=') {
                this.operator = '';
            }
            if (!r[2]) {
                this.semver = m;
            } else {
                this.semver = new SemVer(r[2], this.options.loose);
            }
        };
        Comparator.prototype.toString = function() {
            return this.value;
        };
        Comparator.prototype.test = function(e) {
            r('Comparator.test', e, this.options.loose);
            if (this.semver === m || e === m) {
                return true;
            }
            if (typeof e === 'string') {
                try {
                    e = new SemVer(e, this.options);
                } catch (e) {
                    return false;
                }
            }
            return cmp(e, this.operator, this.semver, this.options);
        };
        Comparator.prototype.intersects = function(e, t) {
            if (!(e instanceof Comparator)) {
                throw new TypeError('a Comparator is required');
            }
            if (!t || typeof t !== 'object') {
                t = { loose: !!t, includePrerelease: false };
            }
            var r;
            if (this.operator === '') {
                if (this.value === '') {
                    return true;
                }
                r = new Range(e.value, t);
                return satisfies(this.value, r, t);
            } else if (e.operator === '') {
                if (e.value === '') {
                    return true;
                }
                r = new Range(this.value, t);
                return satisfies(e.semver, r, t);
            }
            var i = (this.operator === '>=' || this.operator === '>') && (e.operator === '>=' || e.operator === '>');
            var n = (this.operator === '<=' || this.operator === '<') && (e.operator === '<=' || e.operator === '<');
            var o = this.semver.version === e.semver.version;
            var s = (this.operator === '>=' || this.operator === '<=') && (e.operator === '>=' || e.operator === '<=');
            var a =
                cmp(this.semver, '<', e.semver, t) &&
                (this.operator === '>=' || this.operator === '>') && (e.operator === '<=' || e.operator === '<');
            var c =
                cmp(this.semver, '>', e.semver, t) &&
                (this.operator === '<=' || this.operator === '<') && (e.operator === '>=' || e.operator === '>');
            return i || n || (o && s) || a || c;
        };
        t.Range = Range;
        function Range(e, t) {
            if (!t || typeof t !== 'object') {
                t = { loose: !!t, includePrerelease: false };
            }
            if (e instanceof Range) {
                if (e.loose === !!t.loose && e.includePrerelease === !!t.includePrerelease) {
                    return e;
                } else {
                    return new Range(e.raw, t);
                }
            }
            if (e instanceof Comparator) {
                return new Range(e.value, t);
            }
            if (!(this instanceof Range)) {
                return new Range(e, t);
            }
            this.options = t;
            this.loose = !!t.loose;
            this.includePrerelease = !!t.includePrerelease;
            this.raw = e;
            this.set = e
                .split(/\s*\|\|\s*/)
                .map(function(e) {
                    return this.parseRange(e.trim());
                }, this)
                .filter(function(e) {
                    return e.length;
                });
            if (!this.set.length) {
                throw new TypeError('Invalid SemVer Range: ' + e);
            }
            this.format();
        }
        Range.prototype.format = function() {
            this.range = this.set
                .map(function(e) {
                    return e.join(' ').trim();
                })
                .join('||')
                .trim();
            return this.range;
        };
        Range.prototype.toString = function() {
            return this.range;
        };
        Range.prototype.parseRange = function(e) {
            var t = this.options.loose;
            e = e.trim();
            var i = t ? s[c.HYPHENRANGELOOSE] : s[c.HYPHENRANGE];
            e = e.replace(i, hyphenReplace);
            r('hyphen replace', e);
            e = e.replace(s[c.COMPARATORTRIM], f);
            r('comparator trim', e, s[c.COMPARATORTRIM]);
            e = e.replace(s[c.TILDETRIM], u);
            e = e.replace(s[c.CARETTRIM], p);
            e = e.split(/\s+/).join(' ');
            var n = t ? s[c.COMPARATORLOOSE] : s[c.COMPARATOR];
            var o = e
                .split(' ')
                .map(function(e) {
                    return parseComparator(e, this.options);
                }, this)
                .join(' ')
                .split(/\s+/);
            if (this.options.loose) {
                o = o.filter(function(e) {
                    return !!e.match(n);
                });
            }
            o = o.map(function(e) {
                return new Comparator(e, this.options);
            }, this);
            return o;
        };
        Range.prototype.intersects = function(e, t) {
            if (!(e instanceof Range)) {
                throw new TypeError('a Range is required');
            }
            return this.set.some(function(r) {
                return (
                    isSatisfiable(r, t) &&
                    e.set.some(function(e) {
                        return (
                            isSatisfiable(e, t) &&
                            r.every(function(r) {
                                return e.every(function(e) {
                                    return r.intersects(e, t);
                                });
                            })
                        );
                    })
                );
            });
        };
        function isSatisfiable(e, t) {
            var r = true;
            var i = e.slice();
            var n = i.pop();
            while (r && i.length) {
                r = i.every(function(e) {
                    return n.intersects(e, t);
                });
                n = i.pop();
            }
            return r;
        }
        t.toComparators = toComparators;
        function toComparators(e, t) {
            return new Range(e, t).set.map(function(e) {
                return e
                    .map(function(e) {
                        return e.value;
                    })
                    .join(' ')
                    .trim()
                    .split(' ');
            });
        }
        function parseComparator(e, t) {
            r('comp', e, t);
            e = replaceCarets(e, t);
            r('caret', e);
            e = replaceTildes(e, t);
            r('tildes', e);
            e = replaceXRanges(e, t);
            r('xrange', e);
            e = replaceStars(e, t);
            r('stars', e);
            return e;
        }
        function isX(e) {
            return !e || e.toLowerCase() === 'x' || e === '*';
        }
        function replaceTildes(e, t) {
            return e
                .trim()
                .split(/\s+/)
                .map(function(e) {
                    return replaceTilde(e, t);
                })
                .join(' ');
        }
        function replaceTilde(e, t) {
            var i = t.loose ? s[c.TILDELOOSE] : s[c.TILDE];
            return e.replace(i, function(t, i, n, o, s) {
                r('tilde', e, t, i, n, o, s);
                var a;
                if (isX(i)) {
                    a = '';
                } else if (isX(n)) {
                    a = '>=' + i + '.0.0 <' + (+i + 1) + '.0.0';
                } else if (isX(o)) {
                    a = '>=' + i + '.' + n + '.0 <' + i + '.' + (+n + 1) + '.0';
                } else if (s) {
                    r('replaceTilde pr', s);
                    a = '>=' + i + '.' + n + '.' + o + '-' + s + ' <' + i + '.' + (+n + 1) + '.0';
                } else {
                    a = '>=' + i + '.' + n + '.' + o + ' <' + i + '.' + (+n + 1) + '.0';
                }
                r('tilde return', a);
                return a;
            });
        }
        function replaceCarets(e, t) {
            return e
                .trim()
                .split(/\s+/)
                .map(function(e) {
                    return replaceCaret(e, t);
                })
                .join(' ');
        }
        function replaceCaret(e, t) {
            r('caret', e, t);
            var i = t.loose ? s[c.CARETLOOSE] : s[c.CARET];
            return e.replace(i, function(t, i, n, o, s) {
                r('caret', e, t, i, n, o, s);
                var a;
                if (isX(i)) {
                    a = '';
                } else if (isX(n)) {
                    a = '>=' + i + '.0.0 <' + (+i + 1) + '.0.0';
                } else if (isX(o)) {
                    if (i === '0') {
                        a = '>=' + i + '.' + n + '.0 <' + i + '.' + (+n + 1) + '.0';
                    } else {
                        a = '>=' + i + '.' + n + '.0 <' + (+i + 1) + '.0.0';
                    }
                } else if (s) {
                    r('replaceCaret pr', s);
                    if (i === '0') {
                        if (n === '0') {
                            a = '>=' + i + '.' + n + '.' + o + '-' + s + ' <' + i + '.' + n + '.' + (+o + 1);
                        } else {
                            a = '>=' + i + '.' + n + '.' + o + '-' + s + ' <' + i + '.' + (+n + 1) + '.0';
                        }
                    } else {
                        a = '>=' + i + '.' + n + '.' + o + '-' + s + ' <' + (+i + 1) + '.0.0';
                    }
                } else {
                    r('no pr');
                    if (i === '0') {
                        if (n === '0') {
                            a = '>=' + i + '.' + n + '.' + o + ' <' + i + '.' + n + '.' + (+o + 1);
                        } else {
                            a = '>=' + i + '.' + n + '.' + o + ' <' + i + '.' + (+n + 1) + '.0';
                        }
                    } else {
                        a = '>=' + i + '.' + n + '.' + o + ' <' + (+i + 1) + '.0.0';
                    }
                }
                r('caret return', a);
                return a;
            });
        }
        function replaceXRanges(e, t) {
            r('replaceXRanges', e, t);
            return e
                .split(/\s+/)
                .map(function(e) {
                    return replaceXRange(e, t);
                })
                .join(' ');
        }
        function replaceXRange(e, t) {
            e = e.trim();
            var i = t.loose ? s[c.XRANGELOOSE] : s[c.XRANGE];
            return e.replace(i, function(i, n, o, s, a, c) {
                r('xRange', e, i, n, o, s, a, c);
                var l = isX(o);
                var u = l || isX(s);
                var p = u || isX(a);
                var f = p;
                if (n === '=' && f) {
                    n = '';
                }
                c = t.includePrerelease ? '-0' : '';
                if (l) {
                    if (n === '>' || n === '<') {
                        i = '<0.0.0-0';
                    } else {
                        i = '*';
                    }
                } else if (n && f) {
                    if (u) {
                        s = 0;
                    }
                    a = 0;
                    if (n === '>') {
                        n = '>=';
                        if (u) {
                            o = +o + 1;
                            s = 0;
                            a = 0;
                        } else {
                            s = +s + 1;
                            a = 0;
                        }
                    } else if (n === '<=') {
                        n = '<';
                        if (u) {
                            o = +o + 1;
                        } else {
                            s = +s + 1;
                        }
                    }
                    i = n + o + '.' + s + '.' + a + c;
                } else if (u) {
                    i = '>=' + o + '.0.0' + c + ' <' + (+o + 1) + '.0.0' + c;
                } else if (p) {
                    i = '>=' + o + '.' + s + '.0' + c + ' <' + o + '.' + (+s + 1) + '.0' + c;
                }
                r('xRange return', i);
                return i;
            });
        }
        function replaceStars(e, t) {
            r('replaceStars', e, t);
            return e.trim().replace(s[c.STAR], '');
        }
        function hyphenReplace(e, t, r, i, n, o, s, a, c, l, u, p, f) {
            if (isX(r)) {
                t = '';
            } else if (isX(i)) {
                t = '>=' + r + '.0.0';
            } else if (isX(n)) {
                t = '>=' + r + '.' + i + '.0';
            } else {
                t = '>=' + t;
            }
            if (isX(c)) {
                a = '';
            } else if (isX(l)) {
                a = '<' + (+c + 1) + '.0.0';
            } else if (isX(u)) {
                a = '<' + c + '.' + (+l + 1) + '.0';
            } else if (p) {
                a = '<=' + c + '.' + l + '.' + u + '-' + p;
            } else {
                a = '<=' + a;
            }
            return (t + ' ' + a).trim();
        }
        Range.prototype.test = function(e) {
            if (!e) {
                return false;
            }
            if (typeof e === 'string') {
                try {
                    e = new SemVer(e, this.options);
                } catch (e) {
                    return false;
                }
            }
            for (var t = 0; t < this.set.length; t++) {
                if (testSet(this.set[t], e, this.options)) {
                    return true;
                }
            }
            return false;
        };
        function testSet(e, t, i) {
            for (var n = 0; n < e.length; n++) {
                if (!e[n].test(t)) {
                    return false;
                }
            }
            if (t.prerelease.length && !i.includePrerelease) {
                for (n = 0; n < e.length; n++) {
                    r(e[n].semver);
                    if (e[n].semver === m) {
                        continue;
                    }
                    if (e[n].semver.prerelease.length > 0) {
                        var o = e[n].semver;
                        if (o.major === t.major && o.minor === t.minor && o.patch === t.patch) {
                            return true;
                        }
                    }
                }
                return false;
            }
            return true;
        }
        t.satisfies = satisfies;
        function satisfies(e, t, r) {
            try {
                t = new Range(t, r);
            } catch (e) {
                return false;
            }
            return t.test(e);
        }
        t.maxSatisfying = maxSatisfying;
        function maxSatisfying(e, t, r) {
            var i = null;
            var n = null;
            try {
                var o = new Range(t, r);
            } catch (e) {
                return null;
            }
            e.forEach(function(e) {
                if (o.test(e)) {
                    if (!i || n.compare(e) === -1) {
                        i = e;
                        n = new SemVer(i, r);
                    }
                }
            });
            return i;
        }
        t.minSatisfying = minSatisfying;
        function minSatisfying(e, t, r) {
            var i = null;
            var n = null;
            try {
                var o = new Range(t, r);
            } catch (e) {
                return null;
            }
            e.forEach(function(e) {
                if (o.test(e)) {
                    if (!i || n.compare(e) === 1) {
                        i = e;
                        n = new SemVer(i, r);
                    }
                }
            });
            return i;
        }
        t.minVersion = minVersion;
        function minVersion(e, t) {
            e = new Range(e, t);
            var r = new SemVer('0.0.0');
            if (e.test(r)) {
                return r;
            }
            r = new SemVer('0.0.0-0');
            if (e.test(r)) {
                return r;
            }
            r = null;
            for (var i = 0; i < e.set.length; ++i) {
                var n = e.set[i];
                n.forEach(function(e) {
                    var t = new SemVer(e.semver.version);
                    switch (e.operator) {
                        case '>':
                            if (t.prerelease.length === 0) {
                                t.patch++;
                            } else {
                                t.prerelease.push(0);
                            }
                            t.raw = t.format();
                        case '':
                        case '>=':
                            if (!r || gt(r, t)) {
                                r = t;
                            }
                            break;
                        case '<':
                        case '<=':
                            break;
                        default:
                            throw new Error('Unexpected operation: ' + e.operator);
                    }
                });
            }
            if (r && e.test(r)) {
                return r;
            }
            return null;
        }
        t.validRange = validRange;
        function validRange(e, t) {
            try {
                return new Range(e, t).range || '*';
            } catch (e) {
                return null;
            }
        }
        t.ltr = ltr;
        function ltr(e, t, r) {
            return outside(e, t, '<', r);
        }
        t.gtr = gtr;
        function gtr(e, t, r) {
            return outside(e, t, '>', r);
        }
        t.outside = outside;
        function outside(e, t, r, i) {
            e = new SemVer(e, i);
            t = new Range(t, i);
            var n, o, s, a, c;
            switch (r) {
                case '>':
                    n = gt;
                    o = lte;
                    s = lt;
                    a = '>';
                    c = '>=';
                    break;
                case '<':
                    n = lt;
                    o = gte;
                    s = gt;
                    a = '<';
                    c = '<=';
                    break;
                default:
                    throw new TypeError('Must provide a hilo val of "<" or ">"');
            }
            if (satisfies(e, t, i)) {
                return false;
            }
            for (var l = 0; l < t.set.length; ++l) {
                var u = t.set[l];
                var p = null;
                var f = null;
                u.forEach(function(e) {
                    if (e.semver === m) {
                        e = new Comparator('>=0.0.0');
                    }
                    p = p || e;
                    f = f || e;
                    if (n(e.semver, p.semver, i)) {
                        p = e;
                    } else if (s(e.semver, f.semver, i)) {
                        f = e;
                    }
                });
                if (p.operator === a || p.operator === c) {
                    return false;
                }
                if ((!f.operator || f.operator === a) && o(e, f.semver)) {
                    return false;
                } else if (f.operator === c && s(e, f.semver)) {
                    return false;
                }
            }
            return true;
        }
        t.prerelease = prerelease;
        function prerelease(e, t) {
            var r = parse(e, t);
            return r && r.prerelease.length ? r.prerelease : null;
        }
        t.intersects = intersects;
        function intersects(e, t, r) {
            e = new Range(e, r);
            t = new Range(t, r);
            return e.intersects(t);
        }
        t.coerce = coerce;
        function coerce(e, t) {
            if (e instanceof SemVer) {
                return e;
            }
            if (typeof e === 'number') {
                e = String(e);
            }
            if (typeof e !== 'string') {
                return null;
            }
            t = t || {};
            var r = null;
            if (!t.rtl) {
                r = e.match(s[c.COERCE]);
            } else {
                var i;
                while ((i = s[c.COERCERTL].exec(e)) && (!r || r.index + r[0].length !== e.length)) {
                    if (!r || i.index + i[0].length !== r.index + r[0].length) {
                        r = i;
                    }
                    s[c.COERCERTL].lastIndex = i.index + i[1].length + i[2].length;
                }
                s[c.COERCERTL].lastIndex = -1;
            }
            if (r === null) {
                return null;
            }
            return parse(r[2] + '.' + (r[3] || '0') + '.' + (r[4] || '0'), t);
        }
    },
    605: function(e) {
        e.exports = require('http');
    },
    614: function(e) {
        e.exports = require('events');
    },
    622: function(e) {
        e.exports = require('path');
    },
    631: function(e) {
        e.exports = require('net');
    },
    669: function(e) {
        e.exports = require('util');
    },
    672: function(e, t, r) {
        'use strict';
        var i =
            (this && this.__awaiter) ||
            function(e, t, r, i) {
                function adopt(e) {
                    return e instanceof r
                        ? e
                        : new r(function(t) {
                              t(e);
                          });
                }
                return new (r || (r = Promise))(function(r, n) {
                    function fulfilled(e) {
                        try {
                            step(i.next(e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function rejected(e) {
                        try {
                            step(i['throw'](e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function step(e) {
                        e.done ? r(e.value) : adopt(e.value).then(fulfilled, rejected);
                    }
                    step((i = i.apply(e, t || [])).next());
                });
            };
        var n;
        Object.defineProperty(t, '__esModule', { value: true });
        const o = r(357);
        const s = r(747);
        const a = r(622);
        (n = s.promises),
            (t.chmod = n.chmod),
            (t.copyFile = n.copyFile),
            (t.lstat = n.lstat),
            (t.mkdir = n.mkdir),
            (t.readdir = n.readdir),
            (t.readlink = n.readlink),
            (t.rename = n.rename),
            (t.rmdir = n.rmdir),
            (t.stat = n.stat),
            (t.symlink = n.symlink),
            (t.unlink = n.unlink);
        t.IS_WINDOWS = process.platform === 'win32';
        function exists(e) {
            return i(this, void 0, void 0, function*() {
                try {
                    yield t.stat(e);
                } catch (e) {
                    if (e.code === 'ENOENT') {
                        return false;
                    }
                    throw e;
                }
                return true;
            });
        }
        t.exists = exists;
        function isDirectory(e, r = false) {
            return i(this, void 0, void 0, function*() {
                const i = r ? yield t.stat(e) : yield t.lstat(e);
                return i.isDirectory();
            });
        }
        t.isDirectory = isDirectory;
        function isRooted(e) {
            e = normalizeSeparators(e);
            if (!e) {
                throw new Error('isRooted() parameter "p" cannot be empty');
            }
            if (t.IS_WINDOWS) {
                return e.startsWith('\\') || /^[A-Z]:/i.test(e);
            }
            return e.startsWith('/');
        }
        t.isRooted = isRooted;
        function mkdirP(e, r = 1e3, n = 1) {
            return i(this, void 0, void 0, function*() {
                o.ok(e, 'a path argument must be provided');
                e = a.resolve(e);
                if (n >= r) return t.mkdir(e);
                try {
                    yield t.mkdir(e);
                    return;
                } catch (i) {
                    switch (i.code) {
                        case 'ENOENT': {
                            yield mkdirP(a.dirname(e), r, n + 1);
                            yield t.mkdir(e);
                            return;
                        }
                        default: {
                            let r;
                            try {
                                r = yield t.stat(e);
                            } catch (e) {
                                throw i;
                            }
                            if (!r.isDirectory()) throw i;
                        }
                    }
                }
            });
        }
        t.mkdirP = mkdirP;
        function tryGetExecutablePath(e, r) {
            return i(this, void 0, void 0, function*() {
                let i = undefined;
                try {
                    i = yield t.stat(e);
                } catch (t) {
                    if (t.code !== 'ENOENT') {
                        console.log(`Unexpected error attempting to determine if executable file exists '${e}': ${t}`);
                    }
                }
                if (i && i.isFile()) {
                    if (t.IS_WINDOWS) {
                        const t = a.extname(e).toUpperCase();
                        if (r.some(e => e.toUpperCase() === t)) {
                            return e;
                        }
                    } else {
                        if (isUnixExecutable(i)) {
                            return e;
                        }
                    }
                }
                const n = e;
                for (const o of r) {
                    e = n + o;
                    i = undefined;
                    try {
                        i = yield t.stat(e);
                    } catch (t) {
                        if (t.code !== 'ENOENT') {
                            console.log(
                                `Unexpected error attempting to determine if executable file exists '${e}': ${t}`
                            );
                        }
                    }
                    if (i && i.isFile()) {
                        if (t.IS_WINDOWS) {
                            try {
                                const r = a.dirname(e);
                                const i = a.basename(e).toUpperCase();
                                for (const n of yield t.readdir(r)) {
                                    if (i === n.toUpperCase()) {
                                        e = a.join(r, n);
                                        break;
                                    }
                                }
                            } catch (t) {
                                console.log(
                                    `Unexpected error attempting to determine the actual case of the file '${e}': ${t}`
                                );
                            }
                            return e;
                        } else {
                            if (isUnixExecutable(i)) {
                                return e;
                            }
                        }
                    }
                }
                return '';
            });
        }
        t.tryGetExecutablePath = tryGetExecutablePath;
        function normalizeSeparators(e) {
            e = e || '';
            if (t.IS_WINDOWS) {
                e = e.replace(/\//g, '\\');
                return e.replace(/\\\\+/g, '\\');
            }
            return e.replace(/\/\/+/g, '/');
        }
        function isUnixExecutable(e) {
            return (
                (e.mode & 1) > 0 ||
                ((e.mode & 8) > 0 && e.gid === process.getgid()) ||
                ((e.mode & 64) > 0 && e.uid === process.getuid())
            );
        }
    },
    722: function(e) {
        var t = [];
        for (var r = 0; r < 256; ++r) {
            t[r] = (r + 256).toString(16).substr(1);
        }
        function bytesToUuid(e, r) {
            var i = r || 0;
            var n = t;
            return [
                n[e[i++]],
                n[e[i++]],
                n[e[i++]],
                n[e[i++]],
                '-',
                n[e[i++]],
                n[e[i++]],
                '-',
                n[e[i++]],
                n[e[i++]],
                '-',
                n[e[i++]],
                n[e[i++]],
                '-',
                n[e[i++]],
                n[e[i++]],
                n[e[i++]],
                n[e[i++]],
                n[e[i++]],
                n[e[i++]],
            ].join('');
        }
        e.exports = bytesToUuid;
    },
    747: function(e) {
        e.exports = require('fs');
    },
    826: function(e, t, r) {
        var i = r(139);
        var n = r(722);
        function v4(e, t, r) {
            var o = (t && r) || 0;
            if (typeof e == 'string') {
                t = e === 'binary' ? new Array(16) : null;
                e = null;
            }
            e = e || {};
            var s = e.random || (e.rng || i)();
            s[6] = (s[6] & 15) | 64;
            s[8] = (s[8] & 63) | 128;
            if (t) {
                for (var a = 0; a < 16; ++a) {
                    t[o + a] = s[a];
                }
            }
            return t || n(s);
        }
        e.exports = v4;
    },
    835: function(e) {
        e.exports = require('url');
    },
    950: function(e, t, r) {
        'use strict';
        Object.defineProperty(t, '__esModule', { value: true });
        const i = r(835);
        function getProxyUrl(e) {
            let t = e.protocol === 'https:';
            let r;
            if (checkBypass(e)) {
                return r;
            }
            let n;
            if (t) {
                n = process.env['https_proxy'] || process.env['HTTPS_PROXY'];
            } else {
                n = process.env['http_proxy'] || process.env['HTTP_PROXY'];
            }
            if (n) {
                r = i.parse(n);
            }
            return r;
        }
        t.getProxyUrl = getProxyUrl;
        function checkBypass(e) {
            if (!e.hostname) {
                return false;
            }
            let t = process.env['no_proxy'] || process.env['NO_PROXY'] || '';
            if (!t) {
                return false;
            }
            let r;
            if (e.port) {
                r = Number(e.port);
            } else if (e.protocol === 'http:') {
                r = 80;
            } else if (e.protocol === 'https:') {
                r = 443;
            }
            let i = [e.hostname.toUpperCase()];
            if (typeof r === 'number') {
                i.push(`${i[0]}:${r}`);
            }
            for (let e of t
                .split(',')
                .map(e => e.trim().toUpperCase())
                .filter(e => e)) {
                if (i.some(t => t === e)) {
                    return true;
                }
            }
            return false;
        }
        t.checkBypass = checkBypass;
    },
    986: function(e, t, r) {
        'use strict';
        var i =
            (this && this.__awaiter) ||
            function(e, t, r, i) {
                function adopt(e) {
                    return e instanceof r
                        ? e
                        : new r(function(t) {
                              t(e);
                          });
                }
                return new (r || (r = Promise))(function(r, n) {
                    function fulfilled(e) {
                        try {
                            step(i.next(e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function rejected(e) {
                        try {
                            step(i['throw'](e));
                        } catch (e) {
                            n(e);
                        }
                    }
                    function step(e) {
                        e.done ? r(e.value) : adopt(e.value).then(fulfilled, rejected);
                    }
                    step((i = i.apply(e, t || [])).next());
                });
            };
        Object.defineProperty(t, '__esModule', { value: true });
        const n = r(9);
        function exec(e, t, r) {
            return i(this, void 0, void 0, function*() {
                const i = n.argStringToArray(e);
                if (i.length === 0) {
                    throw new Error(`Parameter 'commandLine' cannot be null or empty.`);
                }
                const o = i[0];
                t = i.slice(1).concat(t || []);
                const s = new n.ToolRunner(o, t, r);
                return s.exec();
            });
        }
        t.exec = exec;
    },
});
