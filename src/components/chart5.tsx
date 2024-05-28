/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

// import { data2 } from "./data";

interface Datum {
  data?: any;
  name?: string;
  value?: number;
  type?: string;
  children?: Datum[];
}

// Constants for zooming in and out
// const ZOOM_FACTOR = 0.2; // Change this to adjust the zoom factor
const MIN_ZOOM_LEVEL = 1;
const MAX_ZOOM_LEVEL = 30;

const sizes = [10, 20];
const names = ["EC2", "EKS"];

function getRandomElement(array: any[]) {
  const randomIndex = Math.floor(Math.random() * array.length);
  const randomElement = array[randomIndex];
  return randomElement;
}

export default function Chart5() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<Datum | null>({
    name: "root",
    children: [],
  });
  const [items, setItems] = useState(0);
  const [groups, setGroups] = useState(0);
  const [singleData, setSingleData] = useState(0);
  const itemsRef = useRef<HTMLInputElement>(null);
  const groupsRef = useRef<HTMLInputElement>(null);
  // const [isPanningEnabled, setIsPanningEnabled] = useState(false);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;

    const svgIcon = d3.select("#demo");

    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d?.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const pack = (data: Datum) =>
      d3
        .pack<Datum>()
        .size([width, height])
        .padding(10)(d3.hierarchy(data).sum((d) => d.value ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const root = pack(hierarchy);

    createCircularPacking(root, svgIcon, context, width, height);
    return () => {
      svgIcon.selectAll("*").remove(); // Clear the SVG contents
    };
  }, [data]);

  // const onClickSingle = () => {
  //   const newGroups: any[] = [];

  //   for (let i = 0; i < singleData; i++) {
  //     const singleData = {
  //       name: "datafy-api-gateway",
  //       value: getRandomElement(sizes),
  //       type: getRandomElement(names),
  //     };

  //     newGroups.push(singleData);
  //   }

  //   setData((prevData) => {
  //     if (!prevData?.children) {
  //       return {
  //         ...prevData,
  //         children: newGroups,
  //       };
  //     }
  //     return {
  //       ...prevData,
  //       children: [...prevData.children, ...newGroups],
  //     };
  //   });
  // };

  // const onClickGroup = () => {
  //   const newGroups: any[] = [];

  //   for (let g = 0; g < groups; g++) {
  //     const groupData = {
  //       name: "datafy-api-gateway",
  //       children: [] as Datum[],
  //     };

  //     for (let i = 0; i < items; i++) {
  //       const singleData = {
  //         name: "datafy-api-gateway",
  //         value: getRandomElement(sizes),
  //         type: getRandomElement(names),
  //       };
  //       groupData.children.push(singleData);
  //     }

  //     newGroups.push(groupData);
  //   }

  //   setData((prevData) => {
  //     if (!prevData?.children) {
  //       return {
  //         ...prevData,
  //         children: newGroups,
  //       };
  //     }
  //     return {
  //       ...prevData,
  //       children: [...prevData.children, ...newGroups],
  //     };
  //   });

  //   setGroups(0);
  //   setItems(0);
  //   if (groupsRef.current) {
  //     groupsRef.current.value = "";
  //   }
  //   if (itemsRef.current) {
  //     itemsRef.current.value = "";
  //   }
  // };

  // const onReset = () => {
  //   setGroups(0);
  //   setItems(0);
  //   setData({
  //     name: "root",
  //     children: [],
  //   });
  //   if (itemsRef.current) {
  //     (itemsRef.current as HTMLInputElement).value = "";
  //   }
  // };

  return (
    <>
      <div id="svgCon" className="svgCon">
        <canvas
          id="canvas"
          style={{ border: "1px solid red" }}
          // width={window.innerWidth}
          // height={window.innerHeight}
        ></canvas>
        {/* <svg ref={svgRef} id="demo"></svg> */}
      </div>

      {/* <div className="btns">
        <div className="group1">
          <button id="increaseBtn" onClick={() => {}}>
            +
          </button>
          <button id="decreaseBtn" onClick={() => {}}>
            -
          </button>
        </div>
        <div className="group2">
       
        </div>
      </div> */}

      {/* <div className="floatform">
        <div className="form">
          <div className="form__left">
            <label htmlFor="single">Number of single data:</label>
            <input
              id="single"
              type="text"
              onChange={(e) => setSingleData(Number(e.target.value))}
            />
          </div>
          <button id="single" onClick={onClickSingle}>
            Add single data
          </button>
        </div>
        <div className="form">
          <div className="form__left">
            <label htmlFor="groups">Number of groups:</label>
            <input
              id="groups"
              type="text"
              onChange={(e) => setGroups(Number(e.target.value))}
              ref={groupsRef}
            />
            <label htmlFor="items">Number of items:</label>
            <input
              id="items"
              type="text"
              onChange={(e) => setItems(Number(e.target.value))}
              ref={itemsRef}
            />
          </div>
          <button onClick={onClickGroup}>Add Group</button>
        </div>
        <button onClick={onReset}>Reset</button>
      </div> */}
    </>
  );
}

function createCircularPacking(
  root: d3.HierarchyCircularNode<Datum>, // Add the type argument 'Datum'
  svgIcon: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const view: any = [root.x, root.y, root.r * 2];

  const zoom = d3
    .zoom()
    .scaleExtent([MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL])
    .translateExtent([
      [-width / 2, -height / 2], // Minimum translation (top-left corner)
      [width / 2, height / 2], // Maximum translation (bottom-right corner)
    ])
    .on("zoom", (event) => handleZoom(event, root, context, view));

  const svg = svgIcon
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr(
      "style",
      `display: flex; margin: 0; background: #F6F8FE; border: 0px solid yellow;`
    )
    .call(zoom as any);

  const g = svg
    .append("g")
    .attr("id", "zoomable")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  svg.call(
    zoom.transform as any,
    d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
  );

  d3.select("#increaseBtn").on("click", () => {
    svg.transition().call(zoom.scaleBy as any, 1.2);
  });

  d3.select("#decreaseBtn").on("click", () => {
    svg.transition().call(zoom.scaleBy as any, 0.7);
  });

  drawNodes(root, context, view);
}

function drawNodes(
  root: d3.HierarchyCircularNode<Datum>,
  context: CanvasRenderingContext2D,
  view: any
) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  root.descendants().forEach((d) => {
    context.beginPath();
    context.arc(d.x - view[0], d.y - view[1], d.r, 0, 2 * Math.PI);
    context.fillStyle = d.children
      ? "rgba(66, 84, 251, 0.05)"
      : "rgba(66, 84, 251, 0.19)";
    context.fill();

    if (!d.children) {
      context.font = `${d.r * 0.2}px sans-serif`;
      context.fillStyle = "rgb(92,99,128)";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        (d.data.data.name || d.data.data.type) ?? "",
        d.x - view[0],
        d.y - view[1] + d.r * 0.15
      );
      context.fillText(
        d.data.data?.type ?? "",
        d.x - view[0],
        d.y - view[1] + d.r * 0.3
      );
    }
  });
}

function handleZoom(event: any, root: any, context: any, view: any) {
  const transform = event.transform;
  view[0] = transform.x;
  view[1] = transform.y;
  view[2] = transform.k;
  drawNodes(root, context, view);
}

// function createCircularPacking(
//   root: d3.HierarchyCircularNode<Datum>,
//   context: CanvasRenderingContext2D,
//   width: number,
//   height: number
// ) {
//   const view: any = [root.x, root.y, root.r * 2];

//   //   const zoom = d3
//   //     .zoom()
//   //     .scaleExtent([MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL])
//   //     .translateExtent([
//   //       [-width / 2, -height / 2],
//   //       [width / 2, height / 2],
//   //     ])
//   //     .on("zoom", (e) => handleZoom(e, context, root, view, width, height));

//   const canvas = context.canvas;
//   //   d3.select(canvas)
//   //     .call(zoom as any)
//   //     .call(
//   //       zoom.transform as any,
//   //       d3.zoomIdentity.translate(canvas.width / 2, canvas.height / 2).scale(1)
//   //     );

//   draw(context, root, view);

//   //   d3.select("#increaseBtn").on("click", () => {
//   //     d3.select(canvas)
//   //       .transition()
//   //       .call(zoom.scaleBy as any, 1.2);
//   //   });

//   //   d3.select("#decreaseBtn").on("click", () => {
//   //     d3.select(canvas)
//   //       .transition()
//   //       .call(zoom.scaleBy as any, 0.7);
//   //   });
// }

// function draw(
//   context: CanvasRenderingContext2D,
//   root: d3.HierarchyCircularNode<Datum>,
//   view: any
// ) {
//   //   context.clearRect(
//   //     context.canvas.width / 2,
//   //     context.canvas.height / 2,
//   //     context.canvas.width,
//   //     context.canvas.height
//   //   );

//   context.save();
//   context.translate(context.canvas.width / 2, context.canvas.height / 2);

//   // Draw parent nodes
//   root
//     .descendants()
//     .slice(1)
//     .filter((d) => d.children)
//     .forEach((d) => {
//       context.beginPath();
//       context.fillStyle = "rgba(66, 84, 251, 0.05)";
//       context.arc(d.x - view[0], d.y - view[1], d.r, 0, 2 * Math.PI);
//       context.fill();
//       context.stroke();
//     });

//   // Draw children nodes
//   root
//     .descendants()
//     .filter((d) => !d.children)
//     .forEach((d) => {
//       context.beginPath();
//       context.fillStyle =
//         view.k > 1.5 ? "rgba(255, 255, 255, 1)" : "rgba(66, 84, 251, 0.05)";
//       context.arc(d.x - view[0], d.y - view[1], d.r, 0, 2 * Math.PI);
//       context.fill();
//       context.stroke();
//     });

//   // Draw text labels
//   //   root
//   //     .descendants()
//   //     .filter((d) => !d.children)
//   //     .forEach((d) => {
//   //       context.fillStyle = "black";
//   //       context.font = "10px Arial";
//   //       context.fillText(
//   //         d.data.name ?? "",
//   //         d.x - view[0] - d.r / 2,
//   //         d.y - view[1] - d.r / 2
//   //       );
//   //     });

//   //   root
//   //     .descendants()
//   //     .filter((d) => !d.children)
//   //     .forEach((d) => {
//   //       context.fillStyle = "black";
//   //       context.font = "10px Arial";
//   //       context.fillText(
//   //         d.data.data?.type ?? "",
//   //         d.x - view[0] - d.r / 2,
//   //         d.y - view[1] - d.r / 2
//   //       );
//   //     });

//   root.descendants().forEach((d) => {
//     if (!d.children) {
//       context.fillStyle = "black";
//       context.font = "10px Arial";
//       context.fillText(
//         d.data.name ?? "",
//         d.x - view[0] - d.r / 2,
//         d.y - view[1] - d.r / 2
//       );
//     }
//   });

//   root.descendants().forEach((d) => {
//     if (!d.children) {
//       context.fillStyle = "black";
//       context.font = "10px Arial";
//       context.fillText(
//         d.data.data?.type ?? "",
//         d.x - view[0] - d.r / 2,
//         d.y - view[1] - d.r / 2 + 15 // Adjust vertical position for type label
//       );
//     }
//   });
// }

// // function handleZoom(
// //   event: any,
// //   context: CanvasRenderingContext2D,
// //   root: d3.HierarchyCircularNode<Datum>,
// //   view: any,
// //   width: number,
// //   height: number
// // ) {
// //   const transform = event.transform;
// //   view.k = transform.k;
// //   view.x = transform.x - width / 2;
// //   view.y = transform.y - height / 2;

// //   draw(context, root, view);
// // }

// function getTotalChildrenCount(node: d3.HierarchyNode<Datum>): number {
//   let count = 0;

//   function traverse(node: d3.HierarchyNode<Datum>) {
//     if (node.children) {
//       count += node.children.length;
//       node.children.forEach((child) => traverse(child));
//     }
//   }

//   traverse(node);
//   return count;
// }
