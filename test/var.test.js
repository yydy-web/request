import axios from 'axios'
import { setRequest, getRequest } from '@yy-web/request'
import { describe, it, expect } from 'vitest'

describe('request instance ', () => {

    it ('get error request', () => {
        const request = getRequest()

        expect(request).toBe(null)
    })

    it('set request', () => {
        const axiosInstance = axios.create({
            url: 'http://localhost:8080/',
        })

        setRequest(axiosInstance)

        const yyRequestInstance = getRequest()

        expect(yyRequestInstance).toBeDefined()
    })
})
