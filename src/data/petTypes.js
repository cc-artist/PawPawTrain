export const DEFAULT_PET_TYPES = [
  { type: 'bird', name: '鸟类', emoji: '🐦', breeds: ['鹦鹉', '金丝雀', '鸽子', '文鸟', '虎皮鹦鹉', '八哥', '画眉', '百灵', '黄鹂', '绣眼', '蜡嘴', '蓝鹊', '夜莺', '珍珠鸟'], colors: ['绿色', '黄色', '蓝色', '白色', '彩色', '红色', '橙色', '紫色', '灰白', '黑白'] },
  { type: 'cat', name: '猫咪', emoji: '🐱', breeds: ['英短', '美短', '橘猫', '布偶', '暹罗', '加菲', '波斯', '狸花', '田园', '三花', '缅因猫', '德文卷毛', '无毛', '折耳', '阿比西尼亚', '孟加拉豹猫', '异短', '挪威森林', '俄罗斯蓝猫', '曼基康', '褴褛猫', '索马里', '新加坡猫'], colors: ['白色', '黑色', '橙色', '灰色', '花色', '三花', '虎斑', '蓝灰', '玳瑁', '奶牛', '纯黑', '纯白', '银色', '金色', '乳白', '巧克力', '丁香', '红虎斑', '银虎斑', '重点色'] },
  { type: 'dog', name: '狗狗', emoji: '🐕', breeds: ['金毛', '哈士奇', '泰迪', '柴犬', '柯基', '萨摩耶', '拉布拉多', '贵宾', '比熊', '斗牛', '边牧', '德牧', '雪纳瑞', '秋田', '博美', '法斗', '巴哥', '吉娃娃', '阿拉斯加', '马尔济斯', '杜宾', '松狮', '罗威纳', '大麦町', '喜乐蒂', '伯恩山', '可卡犬', '腊肠犬', '京巴', '约克夏'], colors: ['金色', '黑白', '棕色', '黑色', '白色', '灰色', '黄白', '红棕', '奶油', '巧克力', '银灰', '三色', '陨石', '虎斑', '纯黑', '纯白', '虎纹'] },
  { type: 'fish', name: '鱼类', emoji: '🐟', breeds: ['金鱼', '热带鱼', '锦鲤', '孔雀鱼', '斗鱼', '神仙鱼', '龙鱼', '罗汉鱼', '蝶鱼', '小丑鱼', '天使鱼', '虎皮鱼', '剑尾鱼', '斑马鱼'], colors: ['金色', '红色', '彩色', '银色', '蓝色', '橙色', '白色', '黑色', '黄红', '蓝绿'] },
  { type: 'hamster', name: '仓鼠', emoji: '🐹', breeds: ['金丝熊', '布丁', '银狐', '三线', '公婆鼠', '一线鼠', '奶茶', '紫仓', '白熊', '黑熊', '老公公', '老婆婆'], colors: ['金色', '白色', '灰色', '棕色', '花色', '黑色', '奶油', '银白', '紫灰', '黄白'] },
  { type: 'hedgehog', name: '刺猬', emoji: '🦔', breeds: ['非洲迷你刺猬', '欧洲刺猬', '四趾刺猬', '长耳刺猬'], colors: ['棕色', '白色', '灰色', '花色', '巧克力色'] },
  { type: 'iguana', name: '鬣蜥', emoji: '🦎', breeds: ['绿鬣蜥', '鬃狮蜥', '蓝舌石龙子', '豹纹守宫', '犀牛鬣蜥', '变色龙'], colors: ['绿色', '棕色', '黄色', '橙色', '红色', '蓝色'] },
  { type: 'marmot', name: '土拨鼠', emoji: '🐿️', breeds: ['旱獭', '草原犬鼠', '花栗鼠', '黄鼠'], colors: ['棕色', '灰色', '黄色', '花色'] },
  { type: 'meerkat', name: '狐獴', emoji: '🦝', breeds: ['细尾獴', '黄獴', '条纹獴'], colors: ['棕色', '灰色', '黄色'] },
  { type: 'parrot', name: '鹦鹉', emoji: '🦜', breeds: ['金刚鹦鹉', '玄凤鹦鹉', '牡丹鹦鹉', '葵花鹦鹉', '灰鹦鹉', '小太阳', '吸蜜鹦鹉', '凯克鹦鹉', '亚马逊鹦鹉', '虎皮鹦鹉'], colors: ['红色', '绿色', '蓝色', '黄色', '彩色', '白色', '橙色'] },
  { type: 'rabbit', name: '兔子', emoji: '🐰', breeds: ['垂耳兔', '侏儒兔', '狮子兔', '荷兰兔', '安哥拉兔', '海棠兔', '雷克斯兔', '喜马拉雅兔', '巨型花明兔', '波兰兔', '泽西长毛兔', '迷你垂耳兔', '道奇兔'], colors: ['白色', '灰色', '黑色', '花色', '棕色', '米色', '金色', '黑白', '斑点', '银灰', '奶油', '蓝灰', '巧克力', '虎斑'] },
  { type: 'rat', name: '鼠类', emoji: '🐀', breeds: ['花枝鼠', '小白鼠', '豚鼠', '仓鼠', '沙鼠', '非洲睡鼠'], colors: ['白色', '黑色', '灰色', '花色', '金色', '棕色'] },
  { type: 'snake', name: '蛇', emoji: '🐍', breeds: ['玉米蛇', '球蟒', '王蛇', '奶蛇', '绿森蚺', '眼镜蛇', '红尾蚺', '猪鼻蛇', '翠青蛇', '黑王蛇'], colors: ['绿色', '黄色', '棕色', '黑色', '花色', '白色', '红色', '橙色', '灰色'] },
  { type: 'turtle', name: '乌龟', emoji: '🐢', breeds: ['巴西龟', '草龟', '金钱龟', '陆龟', '鳄龟', '麝香龟', '地图龟', '猪鼻龟', '黄缘龟', '苏卡达陆龟'], colors: ['绿色', '棕色', '黑色', '黄色', '深绿', '浅棕'] },
  { type: 'ferret', name: '貂', emoji: '🦦', breeds: ['雪貂', '安格鲁貂', '玛雪儿貂', '香槟貂'], colors: ['白色', '棕色', '黑色', '花色', '香槟', '银色'] },
  { type: 'chinchilla', name: '龙猫', emoji: '🐹', breeds: ['短尾龙猫', '长尾龙猫', '标准灰', '米色', '银斑', '紫灰', '纯黑', '纯白', '金粉'], colors: ['灰色', '白色', '黑色', '米色', '紫色', '金色', '咖啡'] },
  { type: 'sugar_glider', name: '蜜袋鼯', emoji: '🐨', breeds: ['蜜袋鼯', '白面蜜袋鼯'], colors: ['灰色', '白色', '黑色', '棕色'] },
  { type: 'axolotl', name: '六角恐龙', emoji: '🦎', breeds: ['白化六角恐龙', '野生型', '黑色素', '金色'], colors: ['白色', '黑色', '灰色', '金色', '粉色'] },
  { type: 'frog', name: '蛙类', emoji: '🐸', breeds: ['角蛙', '树蛙', '箭毒蛙', '牛蛙', '雨蛙', '钟角蛙', '老爷树蛙', '红眼树蛙'], colors: ['绿色', '黄色', '红色', '蓝色', '花色', '棕色'] },
  { type: 'gecko', name: '守宫', emoji: '🦎', breeds: ['豹纹守宫', '睫角守宫', '日行守宫', '肥尾守宫', '巨人守宫'], colors: ['黄色', '橙色', '棕色', '白色', '花纹', '红色'] },
  { type: 'tarantula', name: '蜘蛛', emoji: '🕷️', breeds: ['智利红玫瑰', '巴西白膝头', '墨西哥红膝', '金直间', '蓝宝石'], colors: ['黑色', '棕色', '红色', '白色', '蓝色'] },
  { type: 'hermit_crab', name: '寄居蟹', emoji: '🦀', breeds: ['加勒比寄居蟹', '草莓寄居蟹', '紫陆寄居蟹', '蓝陆寄居蟹'], colors: ['红色', '紫色', '橙色', '花色', '蓝色'] },
  { type: 'guinea_pig', name: '豚鼠', emoji: '🐹', breeds: ['荷兰猪', '短顺', '长逆', '泰迪', '无毛豚鼠', '冠毛', '喜马拉雅', '阿比西尼亚'], colors: ['白色', '黑色', '花色', '棕色', '黄色', '三色'] },
  { type: 'lovebird', name: '爱情鸟', emoji: '💖', breeds: ['牡丹鹦鹉', '费氏情侣鹦鹉', '桃脸情侣鹦鹉'], colors: ['绿色', '黄色', '红色', '蓝色', '橙色'] },
]

export const CUSTOM_PET_TYPES_KEY = 'paw_train_custom_pet_types'

export const getPetTypes = () => {
  const customTypes = localStorage.getItem(CUSTOM_PET_TYPES_KEY)
  const parsedCustom = customTypes ? JSON.parse(customTypes) : []
  
  const allTypes = [...DEFAULT_PET_TYPES, ...parsedCustom]
  
  return allTypes.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

export const saveCustomPetType = (petType) => {
  const customTypes = localStorage.getItem(CUSTOM_PET_TYPES_KEY)
  const parsedCustom = customTypes ? JSON.parse(customTypes) : []
  
  const exists = parsedCustom.some(t => t.name === petType.name || t.type === petType.type)
  if (exists) {
    return false
  }
  
  parsedCustom.push(petType)
  localStorage.setItem(CUSTOM_PET_TYPES_KEY, JSON.stringify(parsedCustom))
  return true
}

export const removeCustomPetType = (type) => {
  const customTypes = localStorage.getItem(CUSTOM_PET_TYPES_KEY)
  const parsedCustom = customTypes ? JSON.parse(customTypes) : []
  
  const filtered = parsedCustom.filter(t => t.type !== type)
  localStorage.setItem(CUSTOM_PET_TYPES_KEY, JSON.stringify(filtered))
  return filtered
}
