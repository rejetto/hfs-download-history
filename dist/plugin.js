// ctx.state.downloadHistoryIgnore can be set by other plugins to skip tracking specific requests

exports.description = "Tracks completed downloads and shows per-entry history in file menu"
exports.version = 0.1
exports.apiRequired = 8.89 // openDb

exports.configDialog = {
    sx: { maxWidth: '26em' },
}

exports.config = {
    can_view: {
        type: 'username',
        multiple: true,
        label: "Who can view download history",
        helperText: "If empty, only admins can view",
        frontend: true,
    },
    max_entries_per_file: {
        type: 'number',
        min: 1,
        defaultValue: 100,
        label: "Max entries per file",
        helperText: "Newest entries are kept, older ones are dropped",
    },
}

exports.init = async api => {
    const db = await api.openDb('history.kv', { defaultPutDelay: 5_000, maxPutDelay: 30_000 })

    return {
        frontend_js: 'main.js',
        middleware: ctx => () => {
            if (ctx.status >= 300 || ctx.state.considerAsGui || ctx.state.downloadHistoryIgnore || ctx.state.includesLastByte === false)
                return
            if (!(ctx.state.vfsNode || ctx.state.archive))
                return
            ctx.state.completed.then(() => {
                appendEntry(uriToKey(ctx.path), {
                    finishedAt: Date.now(),
                    ip: ctx.ip,
                    username: api.getCurrentUsername(ctx) || undefined,
                })
            })
        },
        customRest: {
            can_view_download_history(_, ctx) {
                return { can: canViewHistory(ctx) }
            },
            get_download_history({ uri, limit }, ctx) {
                if (!canViewHistory(ctx))
                    throw 403
                if (!uri)
                    throw 'missing uri'
                const key = uriToKey(String(uri))
                const maxEntries = getMaxEntries()
                const entries = trimToMax(readEntries(key), maxEntries, key)
                const wanted = Math.max(1, Math.min(numberOr(limit, maxEntries), maxEntries))
                return { entries: entries.slice(-wanted).reverse() }
            },
        },
    }

    function appendEntry(key, entry) {
        const maxEntries = getMaxEntries()
        const entries = readEntries(key)
        entries.push(entry)
        db.put(key, entries.length > maxEntries ? entries.slice(-maxEntries) : entries)
    }

    function readEntries(key) {
        const entries = db.getSync(key)
        return Array.isArray(entries) ? entries : []
    }

    function trimToMax(entries, maxEntries, key) {
        if (entries.length <= maxEntries)
            return entries
        // prune old records lazily on read so legacy oversized arrays self-heal without a dedicated cleanup job
        const trimmed = entries.slice(-maxEntries)
        db.put(key, trimmed)
        return trimmed
    }

    function canViewHistory(ctx) {
        const viewers = toArray(api.getConfig('can_view'))
        if (viewers.length)
            return api.ctxBelongsTo(ctx, viewers)
        // keep fallback check on backend so ACL remains enforced even if frontend visibility checks are bypassed
        const username = api.getCurrentUsername(ctx)
        return Boolean(username && api.getAccount(username)?.admin)
    }

    function getMaxEntries() {
        return Math.max(1, numberOr(api.getConfig('max_entries_per_file'), 100))
    }

    function uriToKey(uri) {
        return api.normalizeFilename(api.misc.pathDecode(uri))
    }

    function numberOr(v, fallback) {
        const n = Number(v)
        return Number.isFinite(n) ? n : fallback
    }

    function toArray(v) {
        return Array.isArray(v) ? v : v ? [v] : []
    }
}
