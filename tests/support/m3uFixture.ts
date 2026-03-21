export const demoPlaylistFixture = [
  "#EXTM3U",
  '#EXTINF:-1 tvg-name="Alpha Channel" group-title="Live" tvg-logo="https://img.example/alpha.png",Alpha Channel',
  "http://stream.example/live/alpha",
  '#EXTINF:-1 tvg-name="Bravo Movie" group-title="Movies",Bravo Movie',
  "http://stream.example/vod/bravo.mp4",
  '#EXTINF:-1 tvg-name="Charlie Series" group-title="Series",Charlie Series',
  "http://stream.example/series/charlie"
].join("\n");

export const createM3uPlaylistFixture = (itemCount: number): string => {
  const lines = ["#EXTM3U"];

  for (let index = 1; index <= itemCount; index += 1) {
    const mediaType = index % 3 === 0 ? "series" : index % 2 === 0 ? "vod" : "live";
    const categoryLabel = mediaType === "live" ? "Live" : mediaType === "vod" ? "Movies" : "Series";
    const title = `${capitalize(mediaType)} Channel ${index}`;
    lines.push(
      `#EXTINF:-1 tvg-name="${title}" group-title="${categoryLabel}" tvg-logo="https://img.example/${mediaType}-${index}.png",${title}`
    );
    lines.push(`http://stream.example/${mediaType}/${index}`);
  }

  return lines.join("\n");
};

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
