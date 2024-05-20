import * as d3 from "d3";
import { SimulationNodeDatum } from "d3-force";
import { useEffect } from "react";

interface Datum extends SimulationNodeDatum {
  x?: number;
  y?: number;
  name: string;
  group: number;
  size: number;
}

const chartData: Datum[] = [
  { name: "A", group: 1, size: 100 },
  { name: "B", group: 1, size: 300 },
  { name: "C", group: 1, size: 500 },
  { name: "D", group: 1, size: 700 },
  { name: "E", group: 1, size: 900 },
  { name: "F", group: 1, size: 1000 },
  { name: "G", group: 2, size: 200 },
  { name: "H", group: 2, size: 400 },
  { name: "I", group: 2, size: 300 },
  { name: "J", group: 2, size: 600 },
  { name: "K", group: 2, size: 200 },
  { name: "L", group: 2, size: 1000 },
  { name: "M", group: 3, size: 800 },
  { name: "N", group: 3, size: 200 },
  { name: "O", group: 3, size: 100 },
];

function Chart2() {
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // const width = 500;
    // const height = 500;

    const svg = d3
      .select("#demo")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");

    // const x = d3.scaleOrdinal().domain(data.map((d) => d.name)).range([0, width]);
    const x = d3.scaleOrdinal().domain(["1", "2", "3"]).range([250, 400, 540]);

    const color = d3
      .scaleOrdinal()
      .domain(["1", "2", "3"])
      .range(["#FFC300", "#FF5733", "#C70039"]);

    const size = d3.scaleLinear().domain([0, 1000]).range([7, 70]);

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(chartData) // Convert chartData to an array
      .enter()
      .append("circle")
      .attr("r", (d) => size(d.size))
      .attr("cx", width / 1)
      .attr("cy", height / 1)
      .style("fill", (d) => color(String(d.group)) as string)
      .style("opacity", 0.8)
      .attr("stroke", "black")
      .attr("stroke-width", 3);

    const simulation = d3
      .forceSimulation<Datum>()
      .force(
        "x",
        d3
          .forceX<Datum>()
          .strength(0.5)
          .x((d) => x(String(d.group)) as number)
      )
      .force(
        "y",
        d3
          .forceY<Datum>()
          .strength(0.1)
          .y(height / 2)
      )
      .force(
        "center",
        d3
          .forceCenter()
          .x(width / 2)
          .y(height / 2)
      ) // Attraction to the center of the svg area
      .force("charge", d3.forceManyBody().strength(0)) // Nodes are attracted one each other of value is > 0
      .force(
        "collide",
        d3
          .forceCollide<Datum>()
          .strength(1)
          .radius((d) => size(d.size) + 3)
          .iterations(1)
      );

    simulation.nodes(chartData).on("tick", () => {
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
    });

    return () => {
      d3.select("#demo").selectAll("*").remove();
    };
  });
  return (
    <>
      <div className="container">
        <svg id="demo"></svg>
      </div>
    </>
  );
}

export default Chart2;
