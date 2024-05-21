/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import { useEffect } from "react";

import { data2 } from "./data";

interface Datum {
  name?: string;
  value?: number;
  children?: Datum[];
}

function Chart4() {
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Color scale
    const color = d3.scaleLinear<number>().domain([0, 5]);
    //   .range(["rgb(102, 204, 153)", "rgb(35, 45, 77)"]);

    // console.log(color);

    const pack = (data: Datum) =>
      d3
        .pack<Datum>()
        .size([width, height])
        .padding(10)(d3.hierarchy(data).sum((d) => d.value ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const root = pack(data2);

    const svg = d3
      .select("#demo")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", width)
      .attr("height", height)
      .attr(
        "style",
        `max-width: 100%; height: auto; display: block; margin: 0 0px; background: ${color(
          0
        )}; cursor: pointer;`
      );

    const node = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
      .attr("fill", (d) => (d.children ? "red" : "white"))
      .attr("filter", "drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4)")
      .attr("pointer-events", (d) => (!d.children ? "none" : null))
      .on("mouseover", function () {
        d3.select(this).attr("stroke", "#000");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", null);
      })
      .on(
        "click",
        (event, d) => focus !== d && (zoom(event, d), event.stopPropagation())
      );

    const label = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .style("font", "10px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
      .style("display", (d) => (d.parent === root ? "inline" : "none"))
      .text((d) => d.data.name ?? "");

    svg.on("click", (event) => zoom(event, root));
    let focus = root;
    let view: any;
    zoomTo([focus.x, focus.y, focus.r * 2]);

    function zoomTo(v: any) {
      const k = (Math.min(width, height) / v[2]) * 1;
      console.log("k", k);
      console.log("v", v[2]);

      view = v;

      label.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
      node.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
      node.attr("r", (d) => d.r * k);
    }

    function zoom(event: { altKey: any }, d: any) {
      const focus0 = focus;

      focus = d;

      console.log("view", view);
      console.log("focus", focus);

      const transition = svg
        .transition()
        .duration(event.altKey ? 7500 : 750)
        .tween("zoom", () => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return (t) => zoomTo(i(t));
        });

      label
        .filter(function (d) {
          return (
            d.parent === focus ||
            (this as SVGTextElement)?.style.display === "inline"
          );
        })
        .transition(transition)
        .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
        .on("start", function (d) {
          if (d.parent === focus)
            (this as SVGTextElement).style.display = "inline";
        })
        .on("end", function (d) {
          if (d.parent !== focus)
            (this as SVGTextElement).style.display = "none";
        });
    }

    return () => {
      d3.select("#demo").selectAll("*").remove();
    };
  }, []);
  return (
    <>
      <div>
        <svg id="demo"></svg>
      </div>
    </>
  );
}

export default Chart4;
