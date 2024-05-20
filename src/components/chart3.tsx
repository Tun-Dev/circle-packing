/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import { SimulationNodeDatum } from "d3-force";
import { useEffect, useRef } from "react";

interface Datum extends SimulationNodeDatum {
  x?: number;
  y?: number;
  name: string;
  value: number;
}

const data: Datum[] = [
  { name: "A", value: 60 },
  { name: "B", value: 100 },
  { name: "C", value: 50 },
  { name: "D", value: 40 },
  { name: "E", value: 70 },
  { name: "F", value: 90 },
  { name: "G", value: 10 },
  { name: "H", value: 20 },
  { name: "I", value: 60 },
  { name: "J", value: 100 },
  { name: "K", value: 50 },
  { name: "L", value: 45 },
  { name: "M", value: 70 },
  { name: "N", value: 66 },
  { name: "O", value: 10 },
  { name: "P", value: 20 },
  { name: "Q", value: 60 },
  { name: "R", value: 34 },
  { name: "S", value: 50 },
  { name: "T", value: 40 },
  { name: "U", value: 70 },
  { name: "V", value: 90 },
  { name: "W", value: 10 },
  { name: "X", value: 20 },
  { name: "Y", value: 60 },
  { name: "Z", value: 100 },
];

function Chart3() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    console.log(ref);
    const width = ref?.current?.offsetWidth ?? 0;
    const height = ref?.current?.offsetHeight ?? 0;

    const svg = d3
      .select("#demo2")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");

    const size = d3.scaleLinear().domain([0, 100]).range([7, 70]);

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("r", (d) => size(d.value))
      .attr("cx", width / 1)
      .attr("cy", height / 1)
      .style("fill", "#19d3a2")
      .style("fill-opacity", 0.3)
      .attr("stroke", "#b3a2c8")
      .style("stroke-width", 4)
      .call(
        d3
          .drag<SVGCircleElement, Datum>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    const simulation = d3
      .forceSimulation()
      .force(
        "center",
        d3
          .forceCenter()
          .x(width / 2)
          .y(height / 2)
      )
      .force("charge", d3.forceManyBody().strength(1))
      .force(
        "collide",
        d3
          .forceCollide<Datum>()
          .radius((d) => size(d.value) + 2)
          .iterations(1)
      )
      .force(
        "radial",
        d3.forceRadial(
          Math.min(width / 2, height / 2) / 2 - 130,
          width / 2,
          height / 2
        )
      );

    simulation.nodes(data).on("tick", () => {
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
    });

    // What happens when a circle is dragged?
    function dragstarted(event: any, d: Datum) {
      if (!event.active) simulation.alphaTarget(0.03).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: Datum) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: Datum) {
      if (!event.active) simulation.alphaTarget(0.03);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      d3.select("#demo2").selectAll("*").remove();
    };
  }, []);
  return (
    <div className="container-2">
      <h1>Draggable Circular Packing</h1>

      <div className="svgCon" ref={ref}>
        <svg id="demo2"></svg>
      </div>
    </div>
  );
}

export default Chart3;
