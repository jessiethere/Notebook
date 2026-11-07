const button = document.querySelector("#check-connection");
const statusText = document.querySelector("#service-status");
const dot = document.querySelector("#status-dot");

async function checkConnection() {
  button.disabled = true;
  statusText.textContent = "正在连接…";
  dot.className = "status-dot";
  try {
    const response = await fetch("/api/health", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Service unavailable");
    const health = await response.json();
    if (health.status !== "ok" || health.app !== "Notebook")
      throw new Error("Unexpected response");
    statusText.textContent = `已连接 · ${window.location.host}`;
    dot.className = "status-dot online";
  } catch {
    statusText.textContent = "连接中断，请确认本地服务正在运行。";
    dot.className = "status-dot offline";
  } finally {
    button.disabled = false;
  }
}

button.addEventListener("click", checkConnection);
checkConnection();
