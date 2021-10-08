const https = require('https')
const SYNACK_API_URL_HOST = process.env.SYNACK_API_URL
const SYNACK_API_TOKEN = process.env.SYNACK_API_TOKEN
const PAGE_SIZE = 50

exports.fetchSynackVulns = async function fetchSynackVulns() {

    let pageSize = PAGE_SIZE
    return new Promise((resolve, reject) => {
        if (SYNACK_API_URL_HOST === null || SYNACK_API_URL_HOST === undefined) {
            reject('Synack REST API credentials are not specified')
        }
        console.log(`fetching vulnerabilities from Synack in pages by ${PAGE_SIZE}`)
        let allVulnerabilities = []
        let pageNumber = 1
        fetchSynackVulnsRecursively(pageSize, pageNumber, allVulnerabilities)
            .then((allTheVulns) => {
                resolve(allTheVulns)
            })
            .catch((error) => {
                console.error(`error occurred while trying to fetch a vulnerability page from Synack\n ${error}`)
                reject(error)
            })
    })

}

function fetchSynackVulnsRecursively(pageSize, pageNumber, allVulnerabilities) {
    return new Promise((resolve, reject) => {
        fetchSynackVulnsPage(pageSize, pageNumber)
            .then((pageOfVulns) => {
                for (let i = 0; i < pageOfVulns.length; i++) {
                    allVulnerabilities.push(pageOfVulns[i])
                }
                console.log(`got page #${pageNumber}: ${pageOfVulns.length} vulns. total vulns collected: ${allVulnerabilities.length}`)
                if (pageOfVulns.length < pageSize) {
                    resolve(allVulnerabilities)
                } else {
                    pageNumber++
                    fetchSynackVulnsRecursively(pageSize, pageNumber, allVulnerabilities)
                        .then((vulns) => {
                            resolve(vulns)
                        })
                }
            })
            .catch((error) => {
                console.error(`error occurred while trying to fetch a vulnerability page from Synack\n ${error}`)
                reject(error)
            })
    })

}

function fetchSynackVulnsPage(pageSize, pageNumber) {

    return new Promise(((resolve, reject) => {
        let hostname = SYNACK_API_URL_HOST.replace('http://', '').replace('https://', '')
        let options = {
            hostname: hostname,
            path: `/v1/vulnerabilities?filter[include_attachments]=0&page[size]=${pageSize}&page[number]=${pageNumber}`,
            method: 'GET',
            json: true,
            headers: {'Authorization': `Bearer ${SYNACK_API_TOKEN}`}
        }

        let request = https.request(options, function (response) {
            let responseContent = ''
            response.on('data', function (chunk) {
                responseContent += chunk
            })
            response.on('error', function (error) {
                console.error(`ERROR: ${error}`)
                reject(error)
            })
            response.on('end', function () {
                if (response.statusCode === 200) {
                    let synackVulnsJsonArray = JSON.parse(responseContent)
                    resolve(synackVulnsJsonArray)
                } else {
                    reject(responseContent)
                }
            })
        })

        request.end()
    }))
}

exports.fetchComments = async function fetchComments(vulnId) {

    return new Promise(((resolve, reject) => {
        let hostname = SYNACK_API_URL_HOST.replace('http://', '').replace('https://', '')
        let options = {
            hostname: hostname,
            path: `/v1/vulnerabilities/${vulnId}/comments`,
            method: 'GET',
            json: true,
            headers: {'Authorization': `Bearer ${SYNACK_API_TOKEN}`}
        }

        let request = https.request(options, function (response) {
            let responseContent = ''
            response.on('data', function (chunk) {
                responseContent += chunk
            })
            response.on('error', function (error) {
                console.log(`ERROR: ${error}`)
                reject(error)
            })
            response.on('end', function () {
                if (response.statusCode === 200) {
                    let commentsArray = JSON.parse(responseContent)
                    resolve(commentsArray)
                } else {
                    reject(responseContent)
                }
            })
        })

        request.end()
    }))
}
