import type { APIRoute } from "astro";
import AV from "leancloud-storage";

const { Query, User } = AV;

// 声明 class
const HumanRequst = AV.Object.extend("HumanRequst");
const localAppIdEnv = import.meta.env.LEANCLOUD_APPID
const vercelAppIdEnv = process.env.LEANCLOUD_APPID
const localAppKeyEnv = import.meta.env.LEANCLOUD_APPKEY
const vercelAppKeyEnv = process.env.LEANCLOUD_APPKEY

// 初始化 LeanCloud
AV.init({
  appId: localAppIdEnv || vercelAppIdEnv,
  appKey: localAppKeyEnv || vercelAppKeyEnv,
  serverURL: "https://8kis0t90.api.lncldglobal.com",
});

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const record = body.record; // 获取前端记录

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 构建对象
        const humanRequst = new HumanRequst();

        // 为属性赋值
        humanRequst.set("user_input", record.user_input);
        humanRequst.set("generated_text", record.generated_text);

        // 将对象保存到云端
        const savedTodo = await humanRequst.save();

        // 成功保存之后，执行其他逻辑
        console.log(`保存成功。objectId：${savedTodo.id}`);

        // 返回成功响应
        const successMessage = JSON.stringify({
          message: "Record saved successfully.",
          data: savedTodo,
        });
        controller.enqueue(successMessage);
        controller.close();
      } catch (error: unknown) {
        // 返回错误响应
        const errorMessage = JSON.stringify({
          message: "Failed to save the record.",
          error: (error as Error).message,
        });
        controller.enqueue(errorMessage);
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/json" } });
};

export default post;
