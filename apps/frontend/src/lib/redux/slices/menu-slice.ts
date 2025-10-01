import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface MenuTreeNode {
  id: string;
  menuId: string;
  parentId: string | null;
  title: string;
  order: number;
  depth: number;
  isRoot: boolean;
  createdAt: string;
  updatedAt: string;
  children: MenuTreeNode[];
}

export interface MenuPayload {
  id: string;
  name: string;
  depth: number;
  createdAt: string;
  updatedAt: string;
  rootItem: MenuTreeNode | null;
}

export interface MenusState {
  list: MenuPayload[];
  entities: Record<string, MenuPayload>;
  selectedMenuId: string | null;
  selectedItemId: string | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: MenusState = {
  list: [],
  entities: {},
  selectedMenuId: null,
  selectedItemId: null,
  loading: false,
  saving: false,
  error: null,
};

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Unable to reach the backend API. Ensure the backend is running and BACKEND_API_URL is set.');
    }
    throw error;
  }

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in (data as Record<string, unknown>)
        ? String((data as Record<string, unknown>).message)
        : response.statusText;
    throw new Error(message || 'Request failed');
  }

  return data as T;
}

export const fetchMenus = createAsyncThunk<MenuPayload[]>('menus/fetchAll', async () => {
  return request<MenuPayload[]>('/api/menus');
});

export const fetchMenuById = createAsyncThunk<MenuPayload, string>('menus/fetchById', async (menuId) => {
  return request<MenuPayload>(`/api/menus/${menuId}`);
});

export const createMenuItem = createAsyncThunk<
  MenuPayload,
  { menuId: string; parentId: string; title: string }
>('menus/createItem', async ({ menuId, parentId, title }) => {
  return request<MenuPayload>(`/api/menus/${menuId}/items`, {
    method: 'POST',
    body: JSON.stringify({ parentId, title }),
  });
});

export const updateMenuItem = createAsyncThunk<
  MenuPayload,
  { menuId: string; itemId: string; title?: string; parentId?: string | null }
>('menus/updateItem', async ({ menuId, itemId, ...payload }) => {
  return request<MenuPayload>(`/api/menus/${menuId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
});

export const deleteMenuItem = createAsyncThunk<MenuPayload, { menuId: string; itemId: string }>(
  'menus/deleteItem',
  async ({ menuId, itemId }) => {
    return request<MenuPayload>(`/api/menus/${menuId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },
);

const upsertMenu = (state: MenusState, menu: MenuPayload) => {
  state.entities[menu.id] = menu;
  const idx = state.list.findIndex((item) => item.id === menu.id);
  if (idx >= 0) {
    state.list[idx] = menu;
  } else {
    state.list.push(menu);
  }
};

const menusSlice = createSlice({
  name: 'menus',
  initialState,
  reducers: {
    selectMenu(state, action: PayloadAction<string | null>) {
      state.selectedMenuId = action.payload;
      if (action.payload) {
        const menu = state.entities[action.payload];
        state.selectedItemId = menu?.rootItem?.id ?? null;
      } else {
        state.selectedItemId = null;
      }
    },
    selectItem(state, action: PayloadAction<string | null>) {
      state.selectedItemId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenus.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        for (const menu of action.payload) {
          state.entities[menu.id] = menu;
        }
        if (!state.selectedMenuId && action.payload.length) {
          const first = action.payload[0];
          state.selectedMenuId = first.id;
          state.selectedItemId = first.rootItem?.id ?? null;
        }
      })
      .addCase(fetchMenus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load menus';
      })
      .addCase(fetchMenuById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuById.fulfilled, (state, action) => {
        state.loading = false;
        upsertMenu(state, action.payload);
        if (!state.selectedMenuId) {
          state.selectedMenuId = action.payload.id;
          state.selectedItemId = action.payload.rootItem?.id ?? null;
        }
      })
      .addCase(fetchMenuById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load menu';
      })
      .addCase(createMenuItem.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.saving = false;
        upsertMenu(state, action.payload);
      })
      .addCase(createMenuItem.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Unable to add menu item';
      })
      .addCase(updateMenuItem.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        state.saving = false;
        upsertMenu(state, action.payload);
      })
      .addCase(updateMenuItem.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Unable to update menu item';
      })
      .addCase(deleteMenuItem.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.saving = false;
        upsertMenu(state, action.payload);
      })
      .addCase(deleteMenuItem.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Unable to delete menu item';
      });
  },
});

export const { selectMenu, selectItem } = menusSlice.actions;
export const menusReducer = menusSlice.reducer;
export default menusReducer;
