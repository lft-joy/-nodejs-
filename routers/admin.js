var express = require('express');
var router = express.Router();

var User = require('../models/User');
var Category = require('../models/Category');
var Content = require('../models/Content');


router.use(function (req, res, next) {
    if (!req.userInfo.isAdmin) {
        // 当前用户不是管理员
        res.send('对不起，我是警察');
        return;
    }
    next();
});

router.get('/', function (req, res, next) {
    res.render('admin/index')
});

/*
* 用户管理
* */
router.get('/user', function (req, res) {
    // 从数据库读取其中的数据
    /*
    * limit(Number):限制获取的数据条数
    *
    * skip（Number）：需要忽略的之前已经显示的数据
    *
    * 例如每页需要展示五条数据，以limit代表展示的条数
    * 第一页：1-5 skip：0 -> （当前页-1） * limit
    * 第一页：6-10 skip：6 -> （当前页-1） * limit
    * */

    var page = 1;
    var limit = 5;

    // count在之后会被启用，需使用count Documents
    User.countDocuments().then(function (count) {
        // 计算总页数
        pages = Math.ceil(count / limit);
        // 取值不能超过pages
        page = Math.min(page, pages);
        // 取值不能小于1
        page = Math.max(page, 1);
        var skip = (page - 1) * limit;
        User.find().limit(5).skip(skip).then(function (users) {
            res.render('admin/user_index', {
                userInfo: req.userInfo,
                users: users,

                count: count,
                pages: pages,
                limit: limit,
                page: page

            });
        });
    });


});


// 获取分类的信息，并且能进行修改
router.get('/category', function (req, res) {
    // 从数据库读取其中的数据
    /*
    * limit(Number):限制获取的数据条数
    *
    * skip（Number）：需要忽略的之前已经显示的数据
    *
    * 例如每页需要展示五条数据，以limit代表展示的条数
    * 第一页：1-5 skip：0 -> （当前页-1） * limit
    * 第一页：6-10 skip：6 -> （当前页-1） * limit
    * */

    var page = 1;
    var limit = 5;

    // count在之后会被启用，需使用count Documents
    User.countDocuments().then(function (count) {
        // 计算总页数
        pages = Math.ceil(count / limit);
        // 取值不能超过pages
        page = Math.min(page, pages);
        // 取值不能小于1
        page = Math.max(page, 1);
        var skip = (page - 1) * limit;

        /*
        * 1：升序
        * -1： 降序
        * */

        Category.find().sort({_id: -1}).limit(5).skip(skip).then(function (categories) {
            res.render('admin/category_index', {
                userInfo: req.userInfo,
                categories: categories,

                count: count,
                pages: pages,
                limit: limit,
                page: page

            });
        });
    });


});

router.get('/content', function (req, res) {
    // 从数据库读取其中的数据
    /*
    * limit(Number):限制获取的数据条数
    *
    * skip（Number）：需要忽略的之前已经显示的数据
    *
    * 例如每页需要展示五条数据，以limit代表展示的条数
    * 第一页：1-5 skip：0 -> （当前页-1） * limit
    * 第一页：6-10 skip：6 -> （当前页-1） * limit
    * */

    var page = 1;
    var limit = 5;

    // count在之后会被弃用，需使用count Documents
    Content.countDocuments().then(function (count) {
        // 计算总页数
        pages = Math.ceil(count / limit);
        // 取值不能超过pages
        page = Math.min(page, pages);
        // 取值不能小于1
        page = Math.max(page, 1);
        var skip = (page - 1) * limit;

        /*
        * 1：升序
        * -1： 降序
        * */

        Content.find().limit(5).skip(skip).populate(['category','user']).then(function (contents) {
            res.render('admin/content_index', {
                userInfo: req.userInfo,
                contents: contents,

                count: count,
                pages: pages,
                limit: limit,
                page: page

            });
        });
    });


});


/*
* 分类首页
* */
router.get('/category', function (req, res) {
    res.render('admin/category_index', {
        userInfo: req.userInfo
    });
});

/*
* 分类的添加
* */
router.get('/category/add', function (req, res) {
    res.render('admin/category_add', {
        userInfo: req.userInfo
    });
});
/*
* 分类的保存
* */
router.post('/category/add', function (req, res) {

    var name = req.body.name || '';
    if (name == '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '名称不能为空'
        });
        return
    }
    // 数据库中是否已经存在同名分类名称
    Category.findOne({
        name: name
    }).then(function (rs) {
        if (rs) {
            //数据库已经存在该分类
            res.render('admin/error', {
                userInfo: req.userInfo,
                message: '分类已经存在'
            });
            return Promise.reject();
        } else {
            // 不存在该数据，可以保存
            var cat = new Category({
                name: name
            });
            return cat.save();

        }
    }).then(function (newCategory) {
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '分类保存成功',
            url: '/admin/category'
        });
    });

});

// 分类的修改
router.get('/category/edit', function (req, res) {
    // 获取要修改的分类的信息，并且用表单的形式展现出来
    var id = req.query.id || '';

    // 获取要修改的分类信息
    Category.findOne({
        _id: id
    }).then(function (category) {
        if (!category) {
            res.render('admin/error', {
                userInfo: req.userInfo,
                message: '分类信息不存在'
            });
        } else {
            res.render('admin/category_edit', {
                userInfo: req.userInfo,
                category: category
            });
        }
    })
});

/*
* 分类的修改保存
* */
router.post('/category/edit', function (req, res) {
    // 获取要修改的分类的信息，并且用表单的形式展现出来
    var id = req.query.id || '';
    // 获取post过来的名称
    var name = req.body.name || '';

    // 获取要修改的分类信息
    Category.findOne({
        _id: id
    }).then(function (category) {
        if (!category) {
            res.render('admin/error', {
                userInfo: req.userInfo,
                message: '分类信息不存在'
            });
            return Promise.reject();
        } else {
            // 当用户没有做任何的修改时
            if (name == category.name) {
                res.render('admin/success', {
                    userInfo: req.userInfo,
                    message: '修改成功',
                    url: '/admin/category'
                });
                return Promise.reject();
            } else {
                // 要修改的数据在数据库中已经存在了
                return Category.findOne({
                    _id: {$ne: id},
                    name: name
                });
            }
        }
    }).then(function (sameCategory) {
        if (sameCategory) {
            res.render('admin/error', {
                userInfo: req.userInfo,
                message: '数据库中已经存在同名分类'
            });
            return Promise.reject();
        } else {
            return Category.updateOne({
                _id: id
            }, {
                name: name
            });
        }
    }).then(function () {
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '修改成功',
            url: '/admin/category'
        });
    })
})

/*
* 分类的删除
* */
router.get('/category/delete', function (req, res) {
    // 获取删除分类的id
    var id = req.query.id || '';
    Category.remove({
        _id: id
    }).then(function () {
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '删除成功',
            url: '/admin/category'
        });
    });
});

/*
* 内容首页
* */
router.get('/content', function (req, res) {
    res.render('admin/content_index', {
        userInfo: req.userInfo
    })
});

/*
* 内容添加页面
* */
router.get('/content/add', function (req, res) {
    Category.find().then(function (categories) {
        res.render('admin/content_add', {
            userInfo: req.userInfo,
            categories: categories
        })
    })
});

/*
* 内容保存
* */
router.post('/content/add', function (req, res) {
    // console.log(req.body);
    if (req.body.category == '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '内容分类不能为空'
        });
        return;
    }
    if (req.body.title == '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '内容标题不能为空'
        });
        return;
    }
    // 保存数据到数据库
    new Content({
        category: req.body.category,
        title: req.body.title,
        user: req.userInfo._id.toString(),
        description: req.body.description,
        content: req.body.content
    }).save().then(function (rs) {
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '内容保存成功'
        })
    })

});

/*
* 修改内容
* */
router.get('/content/edit', function (req, res) {
    var id = req.query.id || '';
    var categories = [];
    Category.find().sort({_id: 1}).then(function (rs) {
        categories = rs;
        return Content.findOne({
            _id: id
        }).then(function (content) {
            if (!content) {
                res.render('admin/error', {
                    userInfo: req.userInfo,
                    message: '指定内容不存在'
                });
                return Promise.reject();
            } else {
                res.render('admin/content_edit', {
                    userInfo: req.userInfo,
                    categories: categories,
                    content: content
                })
            }
        })
    })


})


/*
* 保存修改内容
* */
router.post('/content/edit', function (req, res) {
    var id = req.query.id || ''

    if (req.body.category == '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '内容分类不能为空'
        });
        return;
    }
    if (req.body.title == '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '内容标题不能为空'
        });
        return;
    }
    // 保存数据到数据库
    Content.update({
        _id: id
    },{
        category: req.body.category,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content
    }).then(function (rs) {
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '内容保存成功',
            url: '/admin/content/edit?id='+id
        })
    })

});

/*
* 内容的删除
* */
router.get('/content/delete', function (req, res) {
    // 获取删除分类的id
    var id = req.query.id || '';
    Content.remove({
        _id: id
    }).then(function () {
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '删除成功',
            url: '/admin/content'
        });
    });
});

module.exports = router;