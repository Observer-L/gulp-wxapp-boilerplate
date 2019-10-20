// logs.js
import { formatTime } from "../../utils/util";
import Storage from "../../utils/storage";

const wxStorage = new Storage();

Page({
  data: {
    logs: [] as string[]
  },
  onLoad() {
    this.setData!({
      logs: (wxStorage.get("logs") || []).map((log: number) => {
        return formatTime(new Date(log));
      })
    });
  }
});
