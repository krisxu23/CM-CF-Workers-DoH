// SPDX-License-Identifier: 0BSD

// 5 个 DoH 服务器地址，请根据需要替换
const dohs = [
  'https://hongkong.dnsovertor.cc/dns-query',
  'https://japan.dnsovertor.cc/dns-query',
  'https://chuncheon.dnsovertor.cc/dns-query',
  'https://seoul.dnsovertor.cc/dns-query',
  'https://singapore.dnsovertor.cc/dns-query'
];
const dohjsons = [
  'https://hongkong.dnsovertor.cc/dns-query',
  'https://japan.dnsovertor.cc/dns-query',
  'https://chuncheon.dnsovertor.cc/dns-query',
  'https://seoul.dnsovertor.cc/dns-query',
  'https://singapore.dnsovertor.cc/dns-query'
];

const contype = 'application/dns-message';
const jstontype = 'application/dns-json';
const path = ''; // default allow all, must start with '/' if specified, eg. "/dns-query"
const r404 = new Response(null, {status: 404});

// 并发请求所有DoH地址，返回第一个成功响应
async function fetchAny(urls, fetchOptions) {
    const fetches = urls.map(url => fetch(url, fetchOptions));
    try {
        return await Promise.any(fetches);
    } catch (e) {
        return new Response('All upstream DOH servers failed', { status: 502 });
    }
}

export default {
    async fetch(r, env, ctx) {
        return handleRequest(r);
    },
};

async function handleRequest(request) {
    let res = r404;
    const { method, headers, url } = request;
    const { searchParams, pathname } = new URL(url);

    // 检查 path
    if (!pathname.startsWith(path)) {
        return r404;
    }

    if (method === 'GET' && searchParams.has('dns')) {
        const fetchUrls = dohs.map(base => base + '?dns=' + searchParams.get('dns'));
        const fetchOptions = {
            method: 'GET',
            headers: { 'Accept': contype }
        };
        res = fetchAny(fetchUrls, fetchOptions);
    } else if (method === 'POST' && headers.get('content-type') === contype) {
        const rostream = request.body;
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Accept': contype,
                'Content-Type': contype
            },
            body: rostream
        };
        res = fetchAny(dohs, fetchOptions);
    } else if (method === 'GET' && headers.get('Accept') === jstontype) {
        const search = new URL(url).search;
        const fetchUrls = dohjsons.map(base => base + search);
        const fetchOptions = {
            method: 'GET',
            headers: { 'Accept': jstontype }
        };
        res = fetchAny(fetchUrls, fetchOptions);
    }

    return res;
}
