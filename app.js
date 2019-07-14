// 应用程序的启动文件

// 加载express模块
var express = require('express');

// 加载模板处理模块
var swig = require('swig');

// 加载body-parser模块，用来处理post传输过来的数据
var bodyParser = require('body-parser');

// 加载cookies模块
var Cookies = require('cookies');

// 加载数据库模块
var mongoose = require('mongoose');

// 创建app应用 => NodeJS Http.createServer();
var app = express();

var User = require('./models/User')

// 设置静态文件托管
// 当用户访问的url以/public开始，那么直接返回对应__dirname + '/public'下的文件
app.use('/public', express.static(__dirname + '/public'));

// 配置应用模板
// 定义当前应用所使用的模板引擎
// 第一个参数：模板引擎的名称， 同时也是模板引擎的后缀，第二个参数表示用于解析模板内容的方法
app.engine('html', swig.renderFile);
// 设置模板文件存放的目录，第一个参数必须是views，第二个是目录
app.set('views', './views');
// 注册所使用的模板引擎，第一个参数必须是view engine，第二个参数和app.engine这个方法中定义的模板引擎的名称（第一个参数—）是一致的
app.set('view engine', 'html');

// 在开发中，需要取消模板缓存
swig.setDefaults({cache: false});

// 设置bodyparser
app.use(bodyParser.urlencoded({extended: true}));

// 设置cookie
app.use(function (req, res, next) {
    req.cookies = new Cookies(req, res);
    // console.log(req.cookies.get('userInfo._id'))
    // 解析登录用户的cookies信息
    req.userInfo = {};
    if (req.cookies.get('userInfo')){
        try {
            req.userInfo = JSON.parse(req.cookies.get('userInfo'));

            // 获取当前登录用户的类型，是否时管理员
            User.findById(req.userInfo._id).then(function (userInfo) {
                req.userInfo.isAdmin = Boolean(userInfo.isAdmin);
                next();
            })
        }catch (e) {
        next();
        }
    }else{
        next();
    }

});

/*
* 根据不同的功能划分模块
* */

app.use('/admin', require('./routers/admin'));
app.use('/api', require('./routers/api'));
app.use('/', require('./routers/main'));
// app.use('/view', require('./routers/main'));


/*
* 首页
* req request对象
* res response对象
* next函数
* */
// app.get('/', function (req, res, next) {
//     // res.send('<h1>boke<h1>');
//     /*
//     读取views目录下的指定文件，解析并返回给客户端
//     第一个参数：表示模板的文件，相对于views目录 views/index.html
//     第二个参数：传递给模板使用的数据
//      */
//     res.render('index');
// });





//监听http请求
// 需要添加{ useNewUrlParser: true }这个属性，否则会有个警告
mongoose.connect('mongodb://localhost:27017/blog', {useNewUrlParser: true}, function (err) {
    if (err) {
        console.log('数据库连接失败');
    } else {
        console.log('数据库连接成功');
        app.listen(8000);
    }
});
