import{r as D,j as e,U as d,Q as L,K as Q}from"./index-BTvfn8c6.js";import{u as B}from"./useQuery-DgMmMGS9.js";import{u as k}from"./useMutation-B3D-2MId.js";import{e as G,f as O}from"./ProductService-BoDmucCl.js";import"./Alert-vY0LSn8E.js";import"./index-DrMltTCj.js";import{C as x,B as m}from"./Badge-BvMIftRM.js";import{B as v}from"./Button-ZOmEEmWf.js";import{t as A,N as C}from"./Upload-B5EJ-QdQ.js";import"./index-B8ZftT__.js";import"./Drawer-BB0eFAGt.js";import"./index-DLYq64dO.js";import"./hoist-non-react-statics.cjs-7QXkVKXm.js";import"./index-CYej4EnW.js";import{D as F}from"./DataTable-6RCwsUpc.js";import"./Progress-DNVzeDE3.js";import"./ScrollBar-D7_TsneS.js";import{z as M,A as I}from"./proxy-yAAJyhxI.js";import{a as U}from"./index-C0LSWwfl.js";import{C as $}from"./ClipLoader-DMEpPbxs.js";import"./toString-BZKBz3l6.js";import"./Views-CJ6KUMaV.js";import"./CloseButton-q8NuGXO0.js";import"./_getPrototype-BSvN2cSG.js";import"./index-Chjiymov.js";const q=({children:r,defaultValue:a})=>{const[s,i]=D.useState(a);return e.jsx("div",{className:"tabs",children:d.Children.map(r,l=>d.isValidElement(l)?d.cloneElement(l,{activeTab:s,setActiveTab:i}):l)})},H=({children:r,activeTab:a,setActiveTab:s})=>e.jsx("div",{className:"flex border-b border-gray-200 mb-4",children:d.Children.map(r,i=>d.isValidElement(i)?d.cloneElement(i,{activeTab:a,setActiveTab:s}):i)}),V=({value:r,children:a,activeTab:s,setActiveTab:i})=>e.jsx("button",{className:`px-4 py-2 font-medium text-sm ${s===r?"border-b-2 border-blue-500 text-blue-600":"text-gray-500 hover:text-gray-700"}`,onClick:()=>i(r),children:a}),z=({value:r,children:a,activeTab:s})=>s===r?e.jsx("div",{className:"py-4",children:a}):null,K=()=>e.jsx("div",{className:"border-t border-gray-200 my-4"}),W={ASSIGNED:"bg-blue-500 text-white w-fit",RETURNED:"bg-emerald-500 text-white w-fit",LOST:"bg-red-500 text-white w-fit",DAMAGED:"bg-amber-500 text-white w-fit"},X={EXCELLENT:"bg-green-500 text-white w-fit",GOOD:"bg-blue-500 text-white w-fit",FAIR:"bg-yellow-500 text-white w-fit",POOR:"bg-red-500 text-white w-fit"},Ne=()=>{var h,p,u,b;const{id:r}=L(),a=Q(),{data:s,isLoading:i,error:l}=B({queryKey:["product",r],queryFn:()=>O(Number(r)),enabled:!!r}),{mutate:E,isPending:P}=k({mutationFn:G,onSuccess:t=>{S(t)},onError:t=>{A.push(e.jsxs(C,{title:"Error",type:"danger",children:["Failed to generate QR code: ",t.message]}))}}),S=t=>{var c,j,f,w,N,y;const o=window.open("","_blank","width=600,height=400");o&&(o.document.write(`
        <html>
          <head>
            <title>Product QR Code</title>
            <style>
              body { 
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
              }
              .qr-container {
                margin: 20px auto;
                max-width: 300px;
              }
              .product-info {
                margin-bottom: 20px;
                text-align: left;
                padding: 0 20px;
              }
              .product-info p {
                margin: 5px 0;
              }
            </style>
          </head>
          <body>
            <h2>Product QR Code</h2>
            <div class="product-info">
              <p><strong>Name:</strong> ${((j=(c=s==null?void 0:s.data)==null?void 0:c.data)==null?void 0:j.name)||"N/A"}</p>
              <p><strong>Model:</strong> ${((w=(f=s==null?void 0:s.data)==null?void 0:f.data)==null?void 0:w.model)||"N/A"}</p>
              <p><strong>Serial:</strong> ${((y=(N=s==null?void 0:s.data)==null?void 0:N.data)==null?void 0:y.serialNumber)||"N/A"}</p>
            </div>
            <div class="qr-container">
              <img src="${t}" alt="QR Code" />
            </div>
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 200);
              };
            <\/script>
          </body>
        </html>
      `),o.document.close())},R=()=>{r&&E(Number(r))},T=[{header:"Employee",cell:t=>{var o,c;return e.jsxs("span",{children:[((o=t.row.original.employee)==null?void 0:o.name)||"Unknown","(",((c=t.row.original.employee)==null?void 0:c.empId)||"N/A",")"]})}},{header:"Assigned On",cell:t=>e.jsx("span",{children:new Date(t.row.original.assignedAt).toLocaleDateString()})},{header:"Returned On",cell:t=>e.jsx("span",{children:t.row.original.returnedAt?new Date(t.row.original.returnedAt).toLocaleDateString():"-"})},{header:"Status",cell:t=>e.jsx(m,{className:W[t.row.original.status]||"bg-gray-500",children:t.row.original.status})},{header:"Condition",cell:t=>t.row.original.condition?e.jsx(m,{className:X[t.row.original.condition]||"bg-gray-500",children:t.row.original.condition}):e.jsx("span",{children:"-"})},{header:"Assigned By",cell:t=>{var o;return e.jsx("span",{children:((o=t.row.original.assignedBy)==null?void 0:o.username)||"Unknown"})}}];if(l&&A.push(e.jsx(C,{title:"Error",type:"danger",children:l.message||"Failed to load product details"})),i)return e.jsx("div",{className:"flex items-center justify-center h-screen",children:e.jsx($,{color:"#3B82F6",size:40})});if(!(s!=null&&s.data))return e.jsx("div",{className:"p-4 text-center",children:"Product not found"});const n=s.data.data,g=(h=n.assignments)==null?void 0:h.some(t=>t.status==="ASSIGNED"&&!t.returnedAt);return e.jsxs("div",{className:"container mx-auto p-4",children:[e.jsxs("div",{className:"flex justify-between items-start mb-4",children:[e.jsx(v,{variant:"plain",icon:e.jsx(M,{}),onClick:()=>a(-1),children:"Back to Products"}),e.jsx(v,{variant:"solid",icon:e.jsx(I,{}),loading:P,onClick:R,children:"Generate & Print QR"})]}),e.jsx(x,{className:"mb-6",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2",children:n.name}),e.jsx("p",{className:"text-gray-600 mb-4",children:n.model}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-semibold",children:"Category:"}),e.jsx("span",{className:"ml-2",children:((p=n.category)==null?void 0:p.name)||"-"})]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-semibold",children:"Branch:"}),e.jsx("span",{className:"ml-2",children:((u=n.branch)==null?void 0:u.name)||"-"})]}),n.warrantyDate&&e.jsxs("div",{children:[e.jsx("span",{className:"font-semibold",children:"Warranty Until:"}),e.jsx("span",{className:"ml-2",children:new Date(n.warrantyDate).toLocaleDateString()})]})]})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-4 mb-4",children:[e.jsx(m,{className:g?"text-white bg-blue-500":"text-white bg-emerald-500",children:g?"Assigned":"Available"}),e.jsx(m,{className:n.complianceStatus?"text-white bg-green-500":"text-white bg-red-500",children:n.complianceStatus?"Compliant":"Non-compliant"})]}),e.jsxs("div",{className:"bg-gray-50 dark:bg-gray-700 p-4 rounded-lg",children:[e.jsx("h3",{className:"font-semibold mb-2",children:"Notes"}),e.jsx("p",{className:"text-gray-600 dark:text-gray-300",children:n.notes||"No notes available"})]})]})]})}),e.jsx(K,{}),e.jsxs(q,{defaultValue:"assignments",children:[e.jsx(H,{children:e.jsx(V,{value:"assignments",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(U,{})," Assignments"]})})}),e.jsxs(z,{value:"assignments",children:[e.jsxs("div",{className:"mb-4",children:[e.jsx("h3",{className:"text-xl font-semibold",children:"Assignment History"}),e.jsx("p",{className:"text-gray-500",children:"All assignments for this product"})]}),((b=n.assignments)==null?void 0:b.length)===0?e.jsx(x,{className:"text-center py-8",children:e.jsx("p",{className:"text-gray-500",children:"No assignments found for this product"})}):e.jsx(x,{children:e.jsx(F,{columns:T,data:n.assignments||[]})})]})]})]})};export{Ne as default};
