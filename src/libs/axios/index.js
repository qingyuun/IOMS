import axios from 'axios'
import { Message } from 'element-ui'
import cookies from '../cookies'
// 创建一个错误
// function errorCreate(msg) {
//   const error = new Error(msg)
//   errorLog(error)
//   throw error
// }

// 记录和显示错误
function errorLog(error) {
  // 打印到控制台
  if (process.env.NODE_ENV === 'development') {
    console.log(error)
  }
  // 显示提示
  Message({
    message: error.message,
    type: 'error',
    duration: 5 * 1000
  })
}

const clearCookie = () => {
  document.cookie.match(/[^ =;]+(?=\=)/g).forEach(item => {
    cookies.remove(item.replace('ioms-', ''))
  })
}

const token = {
  refreshToken() {
    const cookieSetLong = (new Date().getTime() - parseInt(cookies.get('tokenSetTime'))) / 1000 // cookie 写入时长
    const beforeTime = parseInt(cookies.get('expires_in')) - 1000 // 提前时长
    if (cookieSetLong > beforeTime) {
      Message({
        message: '登录已失效，请重新登录',
        type: 'error',
        duration: 5 * 1000
      })
      clearCookie()
      location.href = '/login'
    }
  },
  getToken() {
    token.refreshToken()
    return cookies.get('token_type') + ' ' + cookies.get('access_token')
  }
}

// 创建一个 axios 实例
axios.create({
  baseURL: process.env.VUE_APP_API,
  timeout: 20000, // 请求超时时间
  withCredentials: false
})

const ajaxUrl = process.env.VUE_APP_API // process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' ? process.env.VUE_APP_API : undefined
axios.defaults.baseURL = ajaxUrl
// axios 配置
axios.defaults.timeout = 30000
// 请求拦截器
axios.interceptors.request.use(
  config => {
    // 根据相关情况修改默认url地址
    // const url = config.url
    // config.baseURL = url.indexOf('/easymock') !== -1 ? (process.env.NODE_ENV !== 'development' ? process.env.VUE_APP_API_Easy_Mock : '/') : process.env.NODE_ENV !== 'development' ? process.env.VUE_APP_API : '/'

    // 让每个请求携带token-- ['X-Token']为自定义key 请根据实际情况自行修改
    config.headers['Authorization'] = config.headers.Authorization || token.getToken()
    return config
  },
  error => {
    // 发送失败
    console.log(error)
    Promise.reject(error)
  }
)

// 响应拦截器
axios.interceptors.response.use(
  response => {
    // dataAxios 是 axios 返回数据中的 data
    let dataAxios
    if (response.headers['content-type'] === 'application/octet-stream') {
      dataAxios = response
      debugger
    } else {
      dataAxios = response.data
    }
    // 这个状态码是和后端约定的
    // const { code } = dataAxios
    // 根据 code 进行判断
    // if (code === undefined) {
    //   // 如果没有 code 代表这不是项目后端开发的接口 比如可能是  请求最新版本
    //   return dataAxios
    // } else {
    //   debugger
    //   // 有 code 代表这是一个后端接口 可以进行进一步的判断
    //   switch (code) {
    //     case 0:
    //       // [ 示例 ] code === 0 代表没有错误
    //       return dataAxios.data
    //     case 'xxx':
    //       // [ 示例 ] 其它和后台约定的 code
    //       errorCreate(`[ code: xxx ] ${dataAxios.msg}: ${response.config.url}`)
    //       break
    //     default:
    //       // 不是正确的 code
    //       errorCreate(`${dataAxios.msg}: ${response.config.url}`)
    //       break
    //   }
    // }
    return dataAxios
  },
  error => {
    if (error && error.response) {
      switch (error.response.status) {
        case 400:
          error.message = `请求错误: ${error.response.data.message}`
          break
        case 401:
          error.message = '未授权，请登录'
          clearCookie()
          location.href = '/login'
          break
        case 403:
          error.message = '拒绝访问'
          break
        case 404:
          error.message = `请求地址出错: ${error.response.config.url}`
          break
        case 408:
          error.message = '请求超时'
          break
        case 500:
          error.message = `请求异常： ${error.response.data.message}`
          break
        case 501:
          error.message = '服务未实现'
          break
        case 502:
          error.message = '网关错误'
          break
        case 503:
          error.message = '服务不可用'
          break
        case 504:
          error.message = '网关超时'
          break
        case 505:
          error.message = 'HTTP版本不受支持'
          break
        default:
          break
      }
    }
    errorLog(error)
    return Promise.reject(error)
  }
)

export default axios
