import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  type: 'user' | 'assistant';
  content: string;
  image_url?: string;
  image_prompt?: string;
  created_at: string;
}

export const databaseService = {
  async createUserProfile(id: string, email: string, fullName?: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ id, email, full_name: fullName }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select()
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createConversation(userId: string, title?: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_id: userId, title }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select()
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select()
      .eq('id', conversationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  },

  async addMessage(
    conversationId: string,
    userId: string,
    type: 'user' | 'assistant',
    content: string,
    imageUrl?: string,
    imagePrompt?: string
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          user_id: userId,
          type,
          content,
          image_url: imageUrl,
          image_prompt: imagePrompt,
        },
      ])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select()
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  },
};
