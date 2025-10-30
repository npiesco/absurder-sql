'use client';

import { useEffect, useRef } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { createSQLAutocomplete, getSchemaInfo, SchemaInfo } from '@/lib/editor/sql-autocomplete';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onExecute?: (sql: string) => Promise<any>;
}

export function CodeMirrorEditor({ value, onChange, placeholder, onExecute }: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const schemaCache = useRef<SchemaInfo | null>(null);
  const schemaCacheTime = useRef<number>(0);
  const onExecuteRef = useRef(onExecute);

  // Update the ref when onExecute changes
  useEffect(() => {
    onExecuteRef.current = onExecute;
  }, [onExecute]);

  useEffect(() => {
    if (!editorRef.current) return;

    // Create schema provider function
    const getSchema = async (): Promise<SchemaInfo> => {
      // Cache schema for 5 seconds to avoid excessive queries
      const now = Date.now();
      if (schemaCache.current && now - schemaCacheTime.current < 5000) {
        return schemaCache.current;
      }

      if (onExecuteRef.current) {
        try {
          const schema = await getSchemaInfo(onExecuteRef.current);
          schemaCache.current = schema;
          schemaCacheTime.current = now;
          return schema;
        } catch (error) {
          console.error('Failed to fetch schema for autocomplete:', error);
        }
      }

      return { tables: [], columns: {} };
    };

    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...completionKeymap]),
        sql(),
        autocompletion({
          override: [createSQLAutocomplete(getSchema)],
          activateOnTyping: true,
          maxRenderedOptions: 20,
        }),
        syntaxHighlighting(defaultHighlightStyle),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': {
            height: '200px',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'ui-monospace, monospace',
          },
          '.cm-content': {
            minHeight: '200px',
          },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Update editor when value changes externally
  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return <div ref={editorRef} />;
}
