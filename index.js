import http from "http";
import fs from "node:fs";
import { readFile } from "node:fs/promises";
import Ffmpeg from "fluent-ffmpeg";

const route = {
  "get:/": async (req, res) => {
    const file = await readFile(process.cwd() + "/index.html");
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(file);
  },
  "get:/video": (req, res) => {
    const file = `${process.cwd()}/mp4.mp4`;

    fs.stat(file, (error, stat) => {
      if (error) {
        console.error(error);
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("File not found");
        return;
      }

      const range = req.headers.range;
      const FileSize = stat.size;
      const chunckSize = 1024 * 1024;
      const start = Number(range.replace(/\D/g, ""));
      const end = Math.min(start + chunckSize, FileSize - 1);

      const headers = {
        "Content-Type": "video/mp4",
        "Content-Lenght": end - start,
        "Content-Range": "bytes" + start + "-" + end + "/" + FileSize,
      };

      res.writeHead(206, headers);

      const streamFile = fs.createReadStream(file, { start: start, end: end });
      const ffmpegCreate = Ffmpeg(streamFile).noAudio()
        .videoCodec("libx264")
        .format("mp4")
        .outputOptions("-movflags frag_keyframe+empty_moov")
        .on("end", () => {
          console.log("stream finished");
        })
        .on("error", (error) => {
          console.log(error);
        });
     

      return ffmpegCreate.pipe(res);
    });
  },
  default: (req,res)=>{
    res.writeHead(404,{"Content-Type": "text/plain"})
    return res.end()
  }
};
const handler = async (request, response) => {
  const { method, url } = request;
  const path = `${method}:${url}`.toLocaleLowerCase();
  console.log(path);
  const chosen = route[path] || route.default;
  return chosen(request, response);
};
const server = http.createServer(handler);

server.listen(5000, () => {
  console.log(`Server Listenning at port 5000`);
});
