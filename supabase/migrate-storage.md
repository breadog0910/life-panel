# Supabase Storage 配置详细步骤

## 目标

创建一个叫 `entry_media` 的存储桶（bucket），用来存笔记里的图片。

---

## 步骤 1：打开 Storage 页面

1. 打开 https://supabase.com/dashboard 并登录
2. 点击你的项目（叫 `meyatacfvwhzdlpogwoe` 的那个）
3. 左边菜单栏找到 **Storage**（图标像一个盒子 📦），点击进去

---

## 步骤 2：创建新的 Bucket

1. 在 Storage 页面，点击右上角的 **New bucket** 按钮
2. 填写信息：
   - **Name:** `entry_media` （就这个名字，别打错）
   - **Public bucket:** 打开开关（变成蓝色就是开了）
3. 点击底部的 **Create bucket** 按钮

> ⚠️ 名字必须是 `entry_media`，一字不差，否则代码里找不到

---

## 步骤 3：添加上传策略（用户只能上传自己的文件）

1. 点击刚创建好的 `entry_media` bucket
2. 点击顶部的 **Policies**（策略）标签
3. 点击 **New policy** 按钮
4. 选择 **For full customization**（完全自定义）
5. 填写：
   - **Policy name:** `用户只能上传自己的笔记图片`
   - **Allowed operation:** 只勾选 **INSERT**
   - **Policy definition:** 在输入框里粘贴下面的内容：

```sql
(bucket_id = 'entry_media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

6. 点击 **Review** → 点击 **Save policy**

---

## 步骤 4：添加删除策略（用户只能删除自己的文件）

1. 还是在 Policies 页面，再点一次 **New policy**
2. 选择 **For full customization**
3. 填写：
   - **Policy name:** `用户只能删除自己的笔记图片`
   - **Allowed operation:** 只勾选 **DELETE**
   - **Policy definition:** 在输入框里粘贴下面的内容：

```sql
(bucket_id = 'entry_media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

4. 点击 **Review** → 点击 **Save policy**

---

## 步骤 5：确认读取权限（公开可读）

因为我们创建 bucket 时选了 **Public bucket**，所以读取不需要额外策略，所有人都能通过 URL 直接看图片。

你可以在 Policies 页面看到一条已经存在的策略，大概叫 `Give public access to bucket`，那就是公开读的策略，不用改。

---

## 验证是否成功

做完以上步骤后，你应该在 Policies 页面看到 **3 条策略**：

| 策略名 | 操作 | 作用 |
|--------|------|------|
| Give public access to bucket | SELECT | 公开可读 |
| 用户只能上传自己的笔记图片 | INSERT | 只能上传到自己的文件夹 |
| 用户只能删除自己的笔记图片 | DELETE | 只能删自己的文件 |

---

## 常见问题

**Q: 上传失败，提示 403？**
A: 检查 INSERT 策略是否正确添加了，bucket_id 和名字对不对。

**Q: 图片看不到？**
A: 确认 bucket 是 **Public** 的，不是 Private。
