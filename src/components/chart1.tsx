import * as d3 from "d3";
import { SimulationNodeDatum } from "d3-force";
import { useEffect } from "react";

interface Datum extends SimulationNodeDatum {
  title: string;
  value: number;
  type: string;
  x?: number;
  y?: number;
}

const transactionsData: Datum[] = [
  { title: "test", value: 100, type: "low" },
  { title: "test", value: 200, type: "low" },
  { title: "test", value: 300, type: "middle" },
  { title: "test", value: 400, type: "middle" },
  { title: "test", value: 400, type: "middle" },
  { title: "test", value: 300, type: "middle" },
  { title: "test", value: 500, type: "middle" },
  { title: "test", value: 500, type: "middle" },
  { title: "test", value: 1000, type: "high" },
  { title: "test", value: 1000, type: "high" },
  { title: "test", value: 1000, type: "high" },
  { title: "test", value: 1000, type: "middle" },
  { title: "test", value: 1000, type: "middle" },
  { title: "test", value: 1000, type: "middle" },
  { title: "test", value: 1000, type: "low" },
  { title: "test", value: 10, type: "low" },
  { title: "test", value: 1000, type: "low" },
];

function Chart1() {
  // const ref = useRef(null);
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3
      .select("#my_dataviz")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");

    const color = d3
      .scaleOrdinal()
      .domain(["low", "middle", "high"])
      .range(["#FFC300", "#FF5733", "#C70039"]);

    const size = d3.scaleLinear().domain([0, 1000]).range([7, 70]);

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(transactionsData)
      .join("circle")
      .attr("class", "node")
      .attr("r", (d) => size(d.value))
      .attr("cx", width)
      .attr("cy", height)
      .style("fill", (d) => color(d.type) as string)
      .style("fill-opacity", 0.5);
    const simulation = d3
      .forceSimulation<Datum>()
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("charge", d3.forceManyBody().strength(0.1))
      .force(
        "collide",
        d3
          .forceCollide<Datum>()
          .strength(0.5)
          .radius((d) => size(d.value) + 3)
          .iterations(1)
      );

    simulation.nodes(transactionsData).on("tick", () => {
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
    });

    return () => {
      d3.select("#my_dataviz").selectAll("*").remove();
    };
  }, []);

  return (
    <>
      {/* <div className="container">
        <svg id="demo3">
          <g transform="translate(5,5)"></g>
        </svg>
      </div> */}

      <div className="App">
        <div id="my_dataviz"></div>
      </div>
    </>
  );
}

export default Chart1;
