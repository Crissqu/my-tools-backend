require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 默认cookie（用户需要提供自己的）
const DEFAULT_COOKIE = process.env.ZHIHU_COOKIE || 'z_c0=2|1:0|10:1770517280|4:z_c0|92:Mi4xM0NNWEFBQUFBQUFOb1ZQQjExOHBHeVlBQUFCZ0FsVk5lWXQwYWdDQW5hYzN5dFU3c0IxS1J4YjdyQTFqV2Y4Qnln|24436b4481d038b1f15e7acf33e1a5c557ac863f8e4fef53c275fe96b0a8b939';

// 通用请求头
const getHeaders = (cookie) => ({
  'Cookie': cookie || DEFAULT_COOKIE,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.zhihu.com/',
  'Accept': 'application/json',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
});

// API 1: 获取用户收藏夹列表
app.get('/api/collections', async (req, res) => {
  try {
    const cookie = req.headers.cookie || '';
    
    const response = await axios.get(
      'https://www.zhihu.com/api/v3/collections/mine',
      { headers: getHeaders(cookie) }
    );
    
    const folders = response.data.data?.map(item => ({
      id: item.id,
      name: item.title || '未命名收藏夹',
      count: item.count || 0,
      url: `https://www.zhihu.com/collection/${item.id}`
    })) || [];
    
    res.json({ success: true, data: folders });
  } catch (error) {
    console.error('获取收藏夹失败:', error.message);
    res.json({ 
      success: true, 
      data: [
        { id: 1, name: '技术干货', count: 156, url: '#' },
        { id: 2, name: '学习方法', count: 89, url: '#' },
        { id: 3, name: '阅读书单', count: 234, url: '#' },
      ],
      error: '使用模拟数据'
    });
  }
});

// API 2: 获取收藏夹内文章
app.get('/api/collections/:id/articles', async (req, res) => {
  try {
    const { id } = req.params;
    const cookie = req.headers.cookie || '';
    
    const response = await axios.get(
      `https://www.zhihu.com/api/v3/collections/${id}/contents`,
      { headers: getHeaders(cookie) }
    );
    
    const articles = response.data.data?.map(item => ({
      id: item.id,
      title: item.title || '无标题',
      author: item.author?.name || '未知',
      authorUrl: item.author?.url || '',
      votes: item.upvote_count || 0,
      comments: item.comment_count || 0,
      date: item.created_time ? new Date(item.created_time * 1000).toISOString().split('T')[0] : '',
      url: item.url || `https://zhuanlan.zhihu.com/p/${item.id}`
    })) || [];
    
    res.json({ success: true, data: articles });
  } catch (error) {
    console.error('获取文章失败:', error.message);
    res.json({ 
      success: true, 
      data: [
        { id: 1, title: '如何培养良好的阅读习惯', author: '阅读顾问', votes: 1234, comments: 89, date: '2024-01-15', url: '#' },
        { id: 2, title: 'Python进阶必读的5本书', author: '程序员小王', votes: 892, comments: 45, date: '2024-01-14', url: '#' },
        { id: 3, title: '关于时间管理的10个建议', author: '成长笔记', votes: 2103, comments: 156, date: '2024-01-13', url: '#' },
      ],
      error: '使用模拟数据'
    });
  }
});

// API 3: 获取博主文章
app.get('/api/author/:authorId/articles', async (req, res) => {
  try {
    const { authorId } = req.params;
    const cookie = req.headers.cookie || '';
    
    const response = await axios.get(
      `https://www.zhihu.com/api/v4/members/${authorId}/articles`,
      { 
        headers: getHeaders(cookie),
        params: { limit: 20, offset: 0 }
      }
    );
    
    const articles = response.data.data?.map(item => ({
      id: item.id,
      title: item.title || '无标题',
      author: item.author?.name || authorId,
      authorUrl: item.author?.url || '',
      votes: item.upvote_count || 0,
      comments: item.comment_count || 0,
      date: item.created ? new Date(item.created * 1000).toISOString().split('T')[0] : '',
      url: item.url || `https://zhuanlan.zhihu.com/p/${item.id}`
    })) || [];
    
    res.json({ success: true, data: articles });
  } catch (error) {
    console.error('获取博主文章失败:', error.message);
    res.json({ 
      success: true, 
      data: [
        { id: 1, title: '深入理解JavaScript闭包', author: authorId, votes: 2341, comments: 123, date: '2024-01-15', url: '#' },
        { id: 2, title: '前端性能优化实战', author: authorId, votes: 1892, comments: 87, date: '2024-01-14', url: '#' },
      ],
      error: '使用模拟数据'
    });
  }
});

// API 4: 获取博主信息
app.get('/api/author/:authorId', async (req, res) => {
  try {
    const { authorId } = req.params;
    const cookie = req.headers.cookie || '';
    
    const response = await axios.get(
      `https://www.zhihu.com/api/v4/members/${authorId}`,
      { headers: getHeaders(cookie) }
    );
    
    const data = response.data;
    res.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        headline: data.headline || '',
        avatarUrl: data.avatar_url,
        followers: data.follower_count,
        following: data.following_count,
        url: `https://www.zhihu.com/people/${data.url_token}`
      }
    });
  } catch (error) {
    console.error('获取博主信息失败:', error.message);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// API 5: 获取文章内容
app.get('/api/article/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params;
    const cookie = req.headers.cookie || '';
    
    const response = await axios.get(
      `https://www.zhihu.com/api/v4/articles/${articleId}`,
      { headers: getHeaders(cookie) }
    );
    
    const data = response.data;
    res.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        author: data.author?.name || '未知',
        content: data.content || '',
        votes: data.upvote_count || 0,
        comments: data.comment_count || 0,
        date: data.created ? new Date(data.created * 1000).toISOString().split('T')[0] : '',
        url: data.url
      }
    });
  } catch (error) {
    console.error('获取文章内容失败:', error.message);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
