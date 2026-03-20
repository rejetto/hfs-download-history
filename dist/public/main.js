"use strict";{
    const { h, t, dialogLib } = HFS
    let canViewPromise
    HFS.watchState('username', () => {
        // user identity changed: invalidate cached ACL result so file-menu reflects current permissions immediately
        canViewPromise = undefined
    })

    HFS.onEvent('fileMenu', async ({ entry }) => {
        if (!await canViewHistory())
            return
        return {
            id: 'download-history',
            icon: 'list',
            label: t('downloadHistory_menu', "Download history"),
            onClick: () => openHistoryDialog(entry),
        }
    })

    async function openHistoryDialog(entry) {
        const { entries = [] } = await HFS.customRestCall('get_download_history', { uri: entry.uri }) || {}
        dialogLib.newDialog({
            title: t('downloadHistory_title', "Download history"),
            className: 'download-history-dialog',
            icon: HFS.hIcon('list'),
            Content() {
                if (!entries.length)
                    return h('p', {}, t('downloadHistory_empty', "No downloads yet"))
                return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '.35em', maxHeight: '60vh', overflow: 'auto' } },
                    ...entries.map((row, i) => h('div', {
                        key: i,
                        style: { fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
                    }, `${formatTimestamp(row.finishedAt)}  ${row.ip || '-'} `, row.username || h('i', {}, t('downloadHistory_anonymous', "anonymous"))))
                )
            },
        })
    }

    async function canViewHistory() {
        // cache permission result in-memory to keep menu opening snappy while staying aligned with backend ACL
        canViewPromise ||= HFS.customRestCall('can_view_download_history')
            .then(({ can }) => Boolean(can), () => false)
        return canViewPromise
    }

    function formatTimestamp(v) {
        return v ? new Date(v).toLocaleString() : '-'
    }

}
