const fs = require('fs');
const path = require('path');

const miniprogramDir = path.join('d:/desktop/takeout/miniprogram');
const appJsonPath = path.join(miniprogramDir, 'app.json');

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const adminPages = [
  "pages/admin/dashboard/index",
  "pages/admin/review/index",
  "pages/admin/users/index",
  "pages/admin/orders/index",
  "pages/admin/settings/index"
];

adminPages.forEach(p => {
  if (!appJson.pages.includes(p)) {
    appJson.pages.push(p);
  }
});

// Update tabBar list
const hasAdminTab = appJson.tabBar.list.find(t => t.pagePath === 'pages/admin/dashboard/index');
if (!hasAdminTab) {
  appJson.tabBar.list.splice(3, 0, {
    "pagePath": "pages/admin/dashboard/index",
    "text": "管理"
  });
}

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

// Create dirs and files
adminPages.forEach(p => {
  const dir = path.join(miniprogramDir, path.dirname(p));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const baseName = path.join(dir, 'index');
  const pageName = p.split('/')[2];
  
  if (!fs.existsSync(baseName + '.json')) {
    let title = "管理中心";
    if (pageName === 'dashboard') title = "数据看板";
    if (pageName === 'review') title = "审核中心";
    if (pageName === 'users') title = "用户管理";
    if (pageName === 'orders') title = "订单管理";
    if (pageName === 'settings') title = "平台设置";
    
    fs.writeFileSync(baseName + '.json', JSON.stringify({
      "navigationBarTitleText": title,
      "usingComponents": {}
    }, null, 2));
  }
});

console.log('App.json updated and directories created.');
