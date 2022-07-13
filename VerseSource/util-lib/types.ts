import { SlashCommandBuilder } from "@discordjs/builders";
import { APIButtonComponent } from "discord-api-types/v9";
import { Awaitable, MessageButton, MessageButtonOptions, BaseButtonOptions, ExcludeEnum, MessageOptions, MessagePayload, CommandInteraction, ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { MessageButtonStyles } from "discord.js/typings/enums";

export type SlashCommand =  Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
export type Delegate<T extends unknown[], V = void> = (...agr: T) => Awaitable<V>;
export type ButtonData = MessageButton | MessageButtonOptions | APIButtonComponent;
export type PartialButtonOptions = (BaseButtonOptions & { style?: ExcludeEnum<typeof MessageButtonStyles, 'LINK'> });
export type MessageData = string | MessageOptions | MessagePayload;
export type BaseInteraction = CommandInteraction | ButtonInteraction | ModalSubmitInteraction;

export type FuncAble<T extends object | string | number | boolean, A extends unknown[]> = T | Delegate<A, T>;
