require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API 1: 获取用户收藏夹列表 - 抓网页
app.get('/api/collections', async (req, res) => {
  try {
    const cookie = req.headers.cookie || '';
    
    // 直接抓用户的收藏夹页面
    const response = await axios.get(
      'https://www.zhihu.com/people/${userId}/collections',
      {
        headers: {
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.zhihu.com/',
        }
      }
    );
    
    const $ = cheerio.load(response.data);
    const folders = [];
    
    // 尝试从页面解析收藏夹
    $('.CollectionMainPageCollectionItem').each((i, el) => {
      const name = $(el).find('.CollectionItemMeta-title').text().trim();
      const count = $(el).find('.CollectionItemMeta-count').text().trim();
      const url = $(el).find('a').attr('href');
      
      if (name) {
        folders.push({
          id: i + 1,
          name: name,
          count: parseInt(count) || 0,
          url: 'https://www.zhihu.com' + url
        });
      }
    });
    
    // 如果解析不到，返回说明
    if (folders.length === 0) {
      res.json({ 
        success: true, 
        data: [],
        message: '无法从页面解析收藏夹，请确保Cookie有效'
      });
    } else {
      res.json({ success: true, data: folders });
    }
  } catch (error) {
    console.error('获取收藏夹失败:', error.message);
    res.json({ 
      success: true, 
      data: [],
      error: error.message
    });
  }
});

// API 2: 获取博主信息
app.get('/api/author/:authorId', async (req, res) => {
  try {
    const { authorId } = req.params;
    const cookie = req.headers.cookie || '';
    
    const response = await axios.get(
      `https://www.zhihu.com/people/${authorId}`,
      {
        headers: {
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.zhihu.com/',
        }
      }
    );
    
    const $ = cheerio.load(response.data);
    const name = $('.ProfileHeader-name').text().trim();
    const headline = $('.ProfileHeader-headline').text().trim();
    
    res.json({
      success: true,
      data: {
        id: authorId,
        name: name || authorId,
        headline: headline || '',
        url: `https://www.zhihu.com/people/${authorId}`
      }
    });
  } catch (error) {
    console.error('获取博主信息失败:', error.message);
    res.json({ success: false, error: error.message });
  }
});

// API 3: 获取博主文章
app.get('/api/author/:authorId/articles', async (req, res) => {
  try {
    const { authorId } = req.params;
    const cookie = req.headers.cookie || '';
    
    // 尝试抓取专栏页面
    const response = await axios.get(
      `https://www.zhihu.com/people/${authorId}/posts`,
      {
        headers: {
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.zhihu.com/',
        }
      }
    );
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // 从页面解析文章列表
    $('.List-item').each((i, el) => {
      const title = $(el).find('.ContentItem-title').text().trim();
      const link = $(el).find('.ContentItem-title a').attr('href');
      const author = $(el).find('.AuthorInfo-name').text().trim();
      
      if (title) {
        articles.push({
          id: i + 1,
          title: title,
          author: author || authorId,
          votes: 0,
          comments: 0,
          date: '',
          url: link ? 'https://www.zhihu.com' + link : '#'
        });
      }
    });
    
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

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
