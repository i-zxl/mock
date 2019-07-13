// 复杂的返回结构
// https://github.com/nuysoft/Mock/wiki
const Mockjs = require('mockjs');

module.exports = {
  method: 'get',
  url: '/api/esss',
  handle: function(ctx) {
    return ctx.body = {
      code: 0,
      status: 'success',
      total: 100,
      page: 1, 
      list: Mockjs.mock({
        'test1|1-10': 1
      })
    }  
  }
}