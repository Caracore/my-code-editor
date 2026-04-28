import { useState } from "react";
import { I } from "../Icons";

interface DataBaseViewError {
    message: string;
    code?: string;
}

const [error, setError] = useState<DataBaseViewError | null>(null);


function DataBaseView() {

    // return (
    //     <div className="todo">
    //       <div className="todo__add">
    //         <input
    //           className="todo__add-input"
    //           placeholder="Add a task or note…"
    //           value={draft}
    //           onChange={(e) => setDraft(e.target.value)}
    //           onKeyDown={(e) => {
    //             if (e.key === "Enter") {
    //               e.preventDefault();
    //               addItem();
    //             }
    //           }}
    //         />
    //         <button
    //           className="todo__add-btn"
    //           title="Add task (Enter)"
    //           onClick={addItem}
    //           disabled={!draft.trim()}
    //         >
    //           <I.Plus size={14} />
    //         </button>
    //       </div>
    
    //       <div className="todo__filters">
    //         {(["all", "active", "done"] as Filter[]).map((f) => (
    //           <button
    //             key={f}
    //             className={`todo__filter-btn ${filter === f ? "is-active" : ""}`}
    //             onClick={() => setFilter(f)}
    //           >
    //             {f === "all" ? "All" : f === "active" ? "Active" : "Done"}
    //           </button>
    //         ))}
    //         <span className="todo__count">
    //           {remaining}/{total}
    //         </span>
    //       </div>
    
    //       <div className="todo__list">
    //         {visible.length === 0 ? (
    //           <div className="todo__empty">
    //             {total === 0
    //               ? "No tasks yet. Add one above to get started."
    //               : filter === "active"
    //               ? "No active tasks. Nice work!"
    //               : "No completed tasks yet."}
    //           </div>
    //         ) : (
    //           visible.map((t) => (
    //             <div
    //               key={t.id}
    //               className={`todo__row ${t.done ? "is-done" : ""} ${
    //                 editingId === t.id ? "is-editing" : ""
    //               }`}
    //             >
    //               <button
    //                 className="todo__check"
    //                 title={t.done ? "Mark as active" : "Mark as done"}
    //                 onClick={() => toggleItem(t.id)}
    //               >
    //                 {t.done ? (
    //                   <I.CheckSquare size={16} />
    //                 ) : (
    //                   <I.Square size={16} />
    //                 )}
    //               </button>
    
    //               {editingId === t.id ? (
    //                 <input
    //                   ref={editInputRef}
    //                   className="todo__edit-input"
    //                   value={editingText}
    //                   onChange={(e) => setEditingText(e.target.value)}
    //                   onKeyDown={(e) => {
    //                     if (e.key === "Enter") {
    //                       e.preventDefault();
    //                       commitEdit();
    //                     } else if (e.key === "Escape") {
    //                       e.preventDefault();
    //                       cancelEdit();
    //                     }
    //                   }}
    //                   onBlur={commitEdit}
    //                 />
    //               ) : (
    //                 <span
    //                   className="todo__text"
    //                   title="Double-click to edit"
    //                   onDoubleClick={() => startEdit(t)}
    //                 >
    //                   {t.text}
    //                 </span>
    //               )}
    
    //               <div className="todo__actions">
    //                 <button
    //                   className="todo__icon-btn"
    //                   title="Edit"
    //                   onClick={() => startEdit(t)}
    //                 >
    //                   <I.Edit size={13} />
    //                 </button>
    //                 <button
    //                   className="todo__icon-btn todo__icon-btn--danger"
    //                   title="Delete"
    //                   onClick={() => removeItem(t.id)}
    //                 >
    //                   <I.Trash size={13} />
    //                 </button>
    //               </div>
    //             </div>
    //           ))
    //         )}
    //       </div>
    
    //       <div className="todo__footer">
    //         <button
    //           className="todo__footer-btn"
    //           onClick={clearDone}
    //           disabled={!items.some((t) => t.done)}
    //         >
    //           Clear completed
    //         </button>
    //       </div>
    //     </div>
    //   );}
export default DataBaseView;