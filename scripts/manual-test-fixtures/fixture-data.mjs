export const demoPlaylistFixture = [
  "#EXTM3U",
  '#EXTINF:-1 tvg-name="Alpha Channel" group-title="Live" tvg-logo="https://img.example/alpha.png",Alpha Channel',
  "http://stream.example/live/alpha",
  '#EXTINF:-1 tvg-name="Bravo Movie" group-title="Movies",Bravo Movie',
  "http://stream.example/vod/bravo.mp4",
  '#EXTINF:-1 tvg-name="Charlie Series" group-title="Series",Charlie Series',
  "http://stream.example/series/charlie"
].join("\n");

export const demoXtreamFixture = {
  vodCategories: [{ category_id: "10", category_name: "Movies" }],
  seriesCategories: [{ category_id: "20", category_name: "Series" }],
  liveCategories: [{ category_id: "30", category_name: "Live" }],
  vods: [
    {
      stream_id: 101,
      category_id: "10",
      name: "Xtream Movie",
      stream_icon: "https://img.example/xtream-movie.png",
      added: "1710000000",
      rating: "7.5",
      year: "2024",
      container_extension: "mp4",
      genre: "Action, Adventure"
    }
  ],
  series: [
    {
      series_id: 202,
      category_id: "20",
      name: "Xtream Series",
      cover: "https://img.example/xtream-series.png",
      added: "1710000100",
      rating: "8.1",
      releaseDate: "2023-02-02",
      genre: "Drama, Thriller"
    }
  ],
  lives: [
    {
      stream_id: 303,
      category_id: "30",
      name: "Xtream Live",
      stream_icon: "https://img.example/xtream-live.png",
      added: "1710000200"
    }
  ],
  details: {
    vod: {
      info: {
        name: "Xtream Movie",
        plot: "Movie plot",
        director: "Director Demo"
      }
    },
    series: {
      info: {
        name: "Xtream Series",
        plot: "Series plot"
      },
      episodes: {
        "1": [{ id: 1, title: "Pilot" }]
      }
    },
    live: {
      info: {
        name: "Xtream Live",
        description: "Live channel"
      }
    }
  }
};
